/* lightbox.js — shared lightbox with arrow navigation & keyboard support */
(function (w) {
  var imgs = [], idx = 0, ov, imgEl, btnClose, btnPrev, btnNext, counter;

  function build() {
    if (document.getElementById('_lb')) return;

    ov = mk('div', 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:none;align-items:center;justify-content:center;');
    ov.id = '_lb';

    imgEl = mk('img', 'max-width:88vw;max-height:86vh;object-fit:contain;display:block;user-select:none;pointer-events:none;');

    btnClose = mk('button', 'position:absolute;top:20px;right:24px;background:none;border:none;color:rgba(255,255,255,.5);font-size:24px;line-height:1;cursor:pointer;padding:4px 8px;transition:color .2s;');
    btnClose.innerHTML = '&#10005;';
    btnClose.onmouseenter = function () { this.style.color = '#fff'; };
    btnClose.onmouseleave = function () { this.style.color = 'rgba(255,255,255,.5)'; };

    var aBase = 'position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.65);font-size:18px;cursor:pointer;border-radius:2px;transition:background .18s,color .18s;';
    btnPrev = mk('button', aBase + 'left:20px;');
    btnPrev.innerHTML = '&#8592;';
    btnNext = mk('button', aBase + 'right:20px;');
    btnNext.innerHTML = '&#8594;';
    [btnPrev, btnNext].forEach(function (b) {
      b.onmouseenter = function () { this.style.background = 'rgba(255,255,255,.18)'; this.style.color = '#fff'; };
      b.onmouseleave = function () { this.style.background = 'rgba(255,255,255,.07)'; this.style.color = 'rgba(255,255,255,.65)'; };
    });

    counter = mk('div', 'position:absolute;bottom:18px;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:0.16em;color:rgba(255,255,255,.3);font-family:\'Jost\',\'Helvetica Neue\',sans-serif;white-space:nowrap;');

    btnClose.onclick = close;
    btnPrev.onclick  = function () { go(idx - 1); };
    btnNext.onclick  = function () { go(idx + 1); };
    ov.onclick = function (e) { if (e.target === ov) close(); };

    ov.appendChild(imgEl);
    ov.appendChild(btnClose);
    ov.appendChild(btnPrev);
    ov.appendChild(btnNext);
    ov.appendChild(counter);
    document.body.appendChild(ov);

    document.addEventListener('keydown', function (e) {
      if (ov.style.display === 'none' || !ov.style.display) return;
      if (e.key === 'Escape')     { e.stopImmediatePropagation(); close(); }
      if (e.key === 'ArrowLeft')  { e.stopImmediatePropagation(); go(idx - 1); }
      if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); go(idx + 1); }
    }, true); /* capture phase — fires before slider/drawer handlers */
  }

  function mk(tag, style) {
    var el = document.createElement(tag);
    el.style.cssText = style;
    return el;
  }

  function open(imageList, i) {
    if (!ov) build();
    imgs = Array.isArray(imageList) ? imageList : [imageList];
    go(typeof i === 'number' ? i : 0);
    ov.style.display = 'flex';
  }

  function go(i) {
    idx = ((i % imgs.length) + imgs.length) % imgs.length;
    imgEl.src = imgs[idx];
    var multi = imgs.length > 1;
    btnPrev.style.display = multi ? 'flex' : 'none';
    btnNext.style.display = multi ? 'flex' : 'none';
    counter.style.display = multi ? 'block' : 'none';
    if (multi) counter.textContent = (idx + 1) + ' / ' + imgs.length;
  }

  function close() { ov.style.display = 'none'; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  w.LBOpen = open;
})(window);
