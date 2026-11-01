package io.github.levi20003.sober;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Alkalmazáson belüli frissítés (frissítő modul).
 *
 *  download: letölti a SAJÁT kiadásunkat (a cím rögzített, JavaScriptből nem adható meg) és a mellette lévő .sha256
 *            fájlt, majd ellenőrzi: SHA-256 egyezik; a csomagnév a miénk; az aláíró tanúsítvány ugyanaz, mint a
 *            telepített appé; a verziókód nagyobb. Bármelyik hiba → elutasítás kóddal (CHECKSUM, PACKAGE, SIGNATURE,
 *            NOT_NEWER, NETWORK), a fájl törlődik.
 *  install:  megnyitja az Android telepítőjét (a felhasználó hagyja jóvá). Ha az Android még nem engedi ennek az
 *            appnak a telepítést, a rendszer erre vonatkozó beállítását nyitja meg ({ needsPermission: true }).
 *
 * Adatot nem küld: egyszerű, süti és azonosító nélküli HTTPS GET. Szándékosan nincs naplózás (Log.*).
 */
@CapacitorPlugin(name = "JszUpdater")
public class JszUpdaterPlugin extends Plugin {

    static final String APK_URL = "https://github.com/levi20003/Sober/releases/download/android-latest/jozansag-szamlalo.apk";
    private static final long MAX_BYTES = 100L * 1024 * 1024;

    private File apkFile() {
        return new File(new File(getContext().getCacheDir(), "updates"), "jozansag-szamlalo-update.apk");
    }

    @PluginMethod
    public void download(PluginCall call) {
        new Thread(() -> {
            File out = apkFile();
            try {
                File dir = out.getParentFile();
                if (dir != null && !dir.exists() && !dir.mkdirs()) throw new java.io.IOException("mkdir");
                if (out.exists() && !out.delete()) throw new java.io.IOException("delete");

                String expected;
                try {
                    expected = new String(fetchSmall(APK_URL + ".sha256"), StandardCharsets.UTF_8).trim().split("\\s+")[0].toLowerCase(Locale.ROOT);
                } catch (Exception e) {
                    call.reject("A frissítés nem tölthető le (nincs hálózat?)", "NETWORK");
                    return;
                }
                if (!expected.matches("[0-9a-f]{64}")) {
                    call.reject("Hibás ellenőrzőösszeg-fájl", "CHECKSUM");
                    return;
                }

                String actual;
                try {
                    actual = downloadTo(APK_URL, out);
                } catch (Exception e) {
                    out.delete();
                    call.reject("A frissítés letöltése megszakadt (nincs hálózat?)", "NETWORK");
                    return;
                }
                if (!actual.equals(expected)) {
                    out.delete();
                    call.reject("A letöltött fájl ellenőrzőösszege nem egyezik", "CHECKSUM");
                    return;
                }

                PackageManager pm = getContext().getPackageManager();
                String pkg = getContext().getPackageName();
                PackageInfo archive = archiveInfo(pm, out);
                if (archive == null || !pkg.equals(archive.packageName)) {
                    out.delete();
                    call.reject("A letöltött fájl nem ennek az alkalmazásnak a frissítése", "PACKAGE");
                    return;
                }
                PackageInfo installed = installedInfo(pm, pkg);
                if (!signerHash(archive).equals(signerHash(installed))) {
                    out.delete();
                    call.reject("A letöltött frissítés más kulccsal van aláírva", "SIGNATURE");
                    return;
                }
                long newCode = versionCode(archive);
                if (newCode <= versionCode(installed)) {
                    out.delete();
                    call.reject("Nincs újabb verzió", "NOT_NEWER");
                    return;
                }
                JSObject ret = new JSObject();
                ret.put("ok", true);
                ret.put("versionCode", newCode);
                call.resolve(ret);
            } catch (Exception e) {
                out.delete();
                call.reject("A frissítés ellenőrzése nem sikerült", "UNKNOWN");
            }
        }).start();
    }

    @PluginMethod
    public void install(PluginCall call) {
        File apk = apkFile();
        if (!apk.exists()) {
            call.reject("Nincs letöltött frissítés", "MISSING");
            return;
        }
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(settings);
            ret.put("needsPermission", true);
            call.resolve(ret);
            return;
        }
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        ret.put("started", true);
        call.resolve(ret);
    }

    @SuppressWarnings("deprecation")
    private static PackageInfo archiveInfo(PackageManager pm, File apk) {
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        return pm.getPackageArchiveInfo(apk.getAbsolutePath(), flags);
    }

    @SuppressWarnings("deprecation")
    private static PackageInfo installedInfo(PackageManager pm, String pkg) throws Exception {
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        return pm.getPackageInfo(pkg, flags);
    }

    private static HttpURLConnection open(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setInstanceFollowRedirects(true); // github.com → objects.githubusercontent.com (HTTPS → HTTPS)
        c.setUseCaches(false);
        c.setConnectTimeout(20_000);
        c.setReadTimeout(30_000);
        if (c.getResponseCode() != 200) throw new java.io.IOException("HTTP " + c.getResponseCode());
        if (!"https".equals(c.getURL().getProtocol())) throw new java.io.IOException("not https");
        return c;
    }

    private static byte[] fetchSmall(String url) throws Exception {
        HttpURLConnection c = open(url);
        try (InputStream in = c.getInputStream(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[1024];
            int n;
            while ((n = in.read(buf)) > 0) {
                bos.write(buf, 0, n);
                if (bos.size() > 4096) throw new java.io.IOException("too big");
            }
            return bos.toByteArray();
        } finally {
            c.disconnect();
        }
    }

    /** Letöltés fájlba, közben SHA-256 és folyamatjelzés ("progress" esemény, 0–100). */
    private String downloadTo(String url, File out) throws Exception {
        HttpURLConnection c = open(url);
        long total = c.getContentLengthLong();
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        try (InputStream in = c.getInputStream(); FileOutputStream fos = new FileOutputStream(out)) {
            byte[] buf = new byte[64 * 1024];
            long done = 0;
            int lastPct = -1;
            int n;
            while ((n = in.read(buf)) > 0) {
                fos.write(buf, 0, n);
                md.update(buf, 0, n);
                done += n;
                if (done > MAX_BYTES) throw new java.io.IOException("too big");
                if (total > 0) {
                    int pct = (int) (done * 100 / total);
                    if (pct != lastPct) {
                        lastPct = pct;
                        JSObject p = new JSObject();
                        p.put("percent", pct);
                        notifyListeners("progress", p);
                    }
                }
            }
        } finally {
            c.disconnect();
        }
        return hex(md.digest());
    }

    @SuppressWarnings("deprecation")
    private static String signerHash(PackageInfo info) throws Exception {
        Signature[] sigs = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && info.signingInfo != null
            ? info.signingInfo.getApkContentsSigners()
            : info.signatures;
        if (sigs == null || sigs.length == 0) throw new java.io.IOException("unsigned");
        return hex(MessageDigest.getInstance("SHA-256").digest(sigs[0].toByteArray()));
    }

    @SuppressWarnings("deprecation")
    private static long versionCode(PackageInfo info) {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
    }

    private static String hex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
