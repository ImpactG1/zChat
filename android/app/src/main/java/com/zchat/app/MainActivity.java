package com.zchat.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.zchat.app.overlay.ZChatOverlayPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ZChatOverlayPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
