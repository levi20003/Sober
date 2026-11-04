package io.github.levi20003.sober;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;
import android.view.WindowManager;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Mentésfájl kezelése a WebView-ból (a WebView maga nem tud fájlt letölteni):
 *  - save:  a rendszer „Mentés ide” ablaka (Storage Access Framework). A felhasználó választja ki a helyet,
 *           ezért nem kell tárhely-engedély (nincs WRITE_EXTERNAL_STORAGE).
 *  - share: megosztás egy ideiglenes fájllal az app gyorsítótárából (cache/backups), FileProvideren át,
 *           csak olvasási joggal, csak a kiválasztott alkalmazásnak.
 *  - setSecure: FLAG_SECURE (képernyőkép és feladatváltó-előnézet tiltása), a felhasználó kapcsolja.
 *  - signingInfo: az aláíró tanúsítvány SHA-256 lenyomata (debug vagy kiadási kulcs felismerése).
 * Kép (megosztható mérföldkő-kártya): a "base64" mező csak "image/png" típussal fogadott el, legfeljebb 8 MB-ig;
 * a kép a telefonon készül (SVG → Canvas), a bővítmény csak továbbadja. Minden más tartalom szövegként (UTF-8) megy.
 * Az Activity onPause-kor "pause" eseményt küld a weboldalnak: a napló ekkor zárolódik.
 * Szándékosan nincs naplózás (Log.*): a fájl tartalma soha nem kerül a logcatbe.
 */
@CapacitorPlugin(name = "JszFiles")
public class JszFilesPlugin extends Plugin {

    private static final int MAX_IMAGE_BYTES = 8 * 1024 * 1024;

    /** A kiírandó bájtok: szöveg (UTF-8), vagy csak PNG-képnél base64. Érvénytelen kérésnél null. */
    private static byte[] payload(PluginCall call) {
        String b64 = call.getString("base64");
        if (b64 != null) {
            if (!"image/png".equals(call.getString("mime"))) return null;
            try {
                byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                return bytes.length > 0 && bytes.length <= MAX_IMAGE_BYTES ? bytes : null;
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        String text = call.getString("text");
        return text == null ? null : text.getBytes(StandardCharsets.UTF_8);
    }

    @PluginMethod
    public void save(PluginCall call) {
        String filename = call.getString("filename", "jozansag-mentes.json");
        String mime = call.getString("mime", "application/json");
        if (payload(call) == null) {
            call.reject("Hiányzó tartalom");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mime);
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        startActivityForResult(call, intent, "onSaveResult");
    }

    @ActivityCallback
    private void onSaveResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject ret = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            ret.put("saved", false);
            ret.put("cancelled", true);
            call.resolve(ret);
            return;
        }
        Uri uri = result.getData().getData();
        try (OutputStream out = getContext().getContentResolver().openOutputStream(uri, "wt")) {
            if (out == null) throw new java.io.IOException("Nem írható");
            byte[] bytes = payload(call);
            if (bytes == null) throw new java.io.IOException("Hiányzó tartalom");
            out.write(bytes);
            out.flush();
            ret.put("saved", true);
            ret.put("name", displayName(uri, call.getString("filename")));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("A mentés nem sikerült");
        }
    }

    private String displayName(Uri uri, String fallback) {
        try (android.database.Cursor c = getContext().getContentResolver().query(uri, new String[] { android.provider.OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (Exception ignored) {
            // a név csak tájékoztató
        }
        return fallback;
    }

    @PluginMethod
    public void share(PluginCall call) {
        String filename = call.getString("filename", "jozansag-mentes.json").replaceAll("[^A-Za-z0-9._-]", "_");
        String mime = call.getString("mime", "application/json");
        byte[] bytes = payload(call);
        if (bytes == null) {
            call.reject("Hiányzó tartalom");
            return;
        }
        String caption = call.getString("caption");
        try {
            // Ugyanaz az egyetlen megosztási mappa (cache/backups) a mentésfájlnak és a képnek: a FileProvider nem bővül.
            File dir = new File(getContext().getCacheDir(), "backups");
            // Csak az utolsó megosztott fájl marad meg; a korábbiakat töröljük.
            File[] old = dir.listFiles();
            if (old != null) for (File f : old) f.delete();
            if (!dir.exists() && !dir.mkdirs()) throw new java.io.IOException("mkdir");
            File file = new File(dir, filename);
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(bytes);
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(mime);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            if (caption != null && caption.length() <= 280) send.putExtra(Intent.EXTRA_TEXT, caption);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, null);
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(chooser);
            JSObject ret = new JSObject();
            ret.put("shared", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("A megosztás nem sikerült");
        }
    }

    @PluginMethod
    public void setSecure(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        getActivity().runOnUiThread(() -> {
            if (on) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
            JSObject ret = new JSObject();
            ret.put("on", on);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void signingInfo(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            String pkg = getContext().getPackageName();
            Signature[] sigs;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                PackageInfo info = pm.getPackageInfo(pkg, PackageManager.GET_SIGNING_CERTIFICATES);
                sigs = info.signingInfo.getApkContentsSigners();
            } else {
                PackageInfo info = pm.getPackageInfo(pkg, PackageManager.GET_SIGNATURES);
                sigs = info.signatures;
            }
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(sigs[0].toByteArray());
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) hex.append(String.format("%02x", b));
            JSObject ret = new JSObject();
            ret.put("sha256", hex.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Nem olvasható");
        }
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (getBridge() != null) getBridge().triggerDocumentJSEvent("pause");
    }
}
