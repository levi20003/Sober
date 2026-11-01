package io.github.levi20003.sober;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Saját bővítmény: mentés (Storage Access Framework), megosztás, FLAG_SECURE, aláírás-lenyomat, zárolás pause-kor.
        registerPlugin(JszFilesPlugin.class);
        // Frissítő modul: a kiadott APK letöltése, ellenőrzése és a telepítő megnyitása.
        registerPlugin(JszUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
