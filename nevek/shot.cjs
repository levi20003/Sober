const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1.5});await p.goto('file:///home/user/sober/nevek/lap.html');await p.waitForTimeout(300);await p.screenshot({path:'/home/user/sober/nevek/nevek-es-logok.png',fullPage:true});await b.close();})();
