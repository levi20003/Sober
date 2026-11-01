package io.github.levi20003.sober;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Saját bővítmény: mentés (Storage Access Framework), megosztás, FLAG_SECURE, aláírás-lenyomat, zárolás pause-kor.
        registerPlugin(JszFilesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
