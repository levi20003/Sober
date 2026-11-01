const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:700},deviceScaleFactor:1.5});await p.goto('file:///home/user/sober/nevek/japan-nevek.html');await p.waitForTimeout(300);await p.screenshot({path:'/home/user/sober/nevek/japan-nevek.png',fullPage:true});await b.close();})();
