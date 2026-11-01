// Dimuat di setiap halaman: JSONP tangguh + pendaftaran PWA + banner pasang aplikasi.
(function(){
  // --- JSONP dengan retry (dipakai untuk BACA data) ---
  function once(url, timeout){
    return new Promise(function(resolve, reject){
      var cb='cb_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      var s=document.createElement('script'), done=false;
      var t=setTimeout(function(){ if(done)return; done=true; delete window[cb]; s.remove(); reject(new Error('Timeout')); }, timeout);
      window[cb]=function(d){ if(done)return; done=true; clearTimeout(t); delete window[cb]; s.remove(); resolve(d); };
      s.onerror=function(){ if(done)return; done=true; clearTimeout(t); delete window[cb]; s.remove(); reject(new Error('Error')); };
      s.src=url+(url.indexOf('?')>-1?'&':'?')+'callback='+cb;
      document.head.appendChild(s);
    });
  }
  // retries=2 -> total 3 percobaan (cocok untuk cold start Apps Script)
  window.jsonpRetry=function(url, retries, timeout){
    retries=(retries==null)?2:retries; timeout=timeout||12000;
    return once(url,timeout).catch(function(e){
      if(retries<=0) throw e;
      return new Promise(function(r){setTimeout(r,800);}).then(function(){ return window.jsonpRetry(url,retries-1,timeout); });
    });
  };
  // Pemanasan: bangunkan Apps Script begitu halaman dibuka (mengurangi lemot saat klik pertama)
  window.warmUp=function(){
    try{ if(window.APP_CONFIG&&APP_CONFIG.SCRIPT_URL) once(APP_CONFIG.SCRIPT_URL+'?action=ping&t='+Date.now(),20000).catch(function(){}); }catch(e){}
  };

  // --- Service worker ---
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
  }

  // --- Banner "Pasang Aplikasi" ---
  var standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone;
  var dismissed=false; try{ dismissed=localStorage.getItem('pwaBannerTutup')==='1'; }catch(e){}
  if(standalone||dismissed) return;
  var deferred=null;
  function banner(html, onClick){
    var b=document.createElement('div');
    b.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;background:#1b1d21;color:#f3f3f3;border:1px solid #c9a24a;border-radius:14px;padding:12px 14px;display:flex;gap:10px;align-items:center;font:600 13px/1.4 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45)';
    b.innerHTML='<img src="icons/logo.png" width="36" height="36" style="border-radius:8px" alt=""><div style="flex:1">'+html+'</div>'+
      (onClick?'<button id="pwaPasang" style="background:#c9a24a;color:#0e0f11;border:0;border-radius:9px;padding:8px 12px;font-weight:800;font-size:13px">Pasang</button>':'')+
      '<button id="pwaTutup" aria-label="Tutup" style="background:none;border:0;color:#aaa;font-size:20px;padding:0 4px">×</button>';
    document.body.appendChild(b);
    b.querySelector('#pwaTutup').onclick=function(){ b.remove(); try{localStorage.setItem('pwaBannerTutup','1');}catch(e){} };
    if(onClick) b.querySelector('#pwaPasang').onclick=function(){ onClick(); b.remove(); };
  }
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault(); deferred=e;
    banner('Pasang <b>Absensi Assyifa</b> di HP agar buka lebih cepat, tanpa iklan.',function(){ deferred.prompt(); });
  });
  var ua=navigator.userAgent, isIOS=/iPhone|iPad|iPod/.test(ua);
  if(isIOS){
    window.addEventListener('load',function(){ setTimeout(function(){
      banner('Pasang aplikasi: ketuk tombol <b>Bagikan</b> (kotak berpanah) di Safari, lalu pilih <b>Tambah ke Layar Utama</b>.');
    },2500); });
  }
})();
