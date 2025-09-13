(function(){
  const KEY = 'pf_mock_cart_v1';
  const $$ = (s, r=document) => r.querySelector(s);
  const $$$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const money = (n) => '£' + (Number(n||0)).toFixed(2);

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e){ return []; }
  }
  function save(cart){ localStorage.setItem(KEY, JSON.stringify(cart)); }

  const Cart = {
    get(){ return load(); },
    set(c){ save(c); UI.update(); },
    add(item){
      const cart = load();
      const idx = cart.findIndex(x => x.sku === item.sku);
      if (idx >= 0) cart[idx].qty += item.qty || 1; else cart.push({ ...item, qty: item.qty || 1 });
      save(cart); UI.ping(); UI.update();
    },
    remove(sku){ const cart = load().filter(x => x.sku !== sku); save(cart); UI.update(); },
    updateQty(sku, qty){
      qty = Math.max(1, parseInt(qty||1,10));
      const cart = load();
      const it = cart.find(x=>x.sku===sku); if (it){ it.qty = qty; save(cart); UI.update(); }
    },
    clear(){ save([]); UI.update(); },
    count(){ return load().reduce((a,b)=>a + (b.qty||1), 0); },
    subtotal(){ return load().reduce((a,b)=>a + (b.price||0) * (b.qty||1), 0); }
  };

  const UI = {
    ensure(){
      if ($$('#pf-mock-cart-root')) return;
      const root = document.createElement('div'); root.id = 'pf-mock-cart-root';
      root.innerHTML = `
        <style>
          #pf-mock-cart-fab{position:fixed;right:18px;bottom:18px;z-index:9999;background:#007bff;color:#fff;border-radius:24px;padding:10px 14px;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer;font-weight:700;}
          #pf-mock-cart-fab .cnt{background:#fff;color:#007bff;border-radius:12px;padding:2px 8px;margin-left:8px;font-weight:700;}
          #pf-mock-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9998;display:none;}
          #pf-mock-cart-drawer{position:fixed;top:0;right:-420px;width:400px;max-width:95vw;height:100vh;background:#fff;z-index:10000;box-shadow:-4px 0 18px rgba(0,0,0,.2);transition:right .25s ease;display:flex;flex-direction:column;}
          #pf-mock-cart-drawer.open{right:0}
          #pf-mock-cart-overlay.open{display:block}
          #pf-mock-cart-drawer header{padding:14px 16px;border-bottom:1px solid #e9ecef;display:flex;justify-content:space-between;align-items:center;font-weight:700}
          #pf-mock-cart-list{padding:12px 16px;overflow:auto;flex:1}
          #pf-mock-cart-empty{padding:40px 16px;text-align:center;color:#6c757d}
          .pf-item{display:grid;grid-template-columns:60px 1fr auto;gap:10px;align-items:center;border-bottom:1px solid #f1f3f5;padding:10px 0}
          .pf-item img{width:60px;height:60px;object-fit:contain;border-radius:6px;background:#f8f9fa}
          .pf-item .title{font-weight:600;font-size:.95rem}
          .pf-item .sku{font-size:.8rem;color:#6c757d}
          .pf-item .price{font-weight:700;color:#28a745;text-align:right}
          .pf-item .qty{display:flex;gap:6px;align-items:center}
          .pf-item .qty input{width:48px;padding:6px;border:1px solid #ced4da;border-radius:6px;text-align:center}
          #pf-mock-cart-summary{border-top:1px solid #e9ecef;padding:12px 16px}
          #pf-mock-cart-summary .row{display:flex;justify-content:space-between;margin:6px 0}
          #pf-mock-cart-summary .checkout{width:100%;padding:12px 16px;background:#007bff;color:#fff;border:none;border-radius:8px;font-weight:700;margin-top:8px;cursor:pointer}
        </style>
        <button id="pf-mock-cart-fab" aria-label="Open cart">Cart <span class="cnt">0</span></button>
        <div id="pf-mock-cart-overlay" tabindex="-1" aria-hidden="true"></div>
        <aside id="pf-mock-cart-drawer" aria-label="Cart drawer" aria-modal="true" role="dialog">
          <header>
            <span>Cart</span>
            <button type="button" id="pf-mock-cart-close" aria-label="Close">✕</button>
          </header>
          <div id="pf-mock-cart-list"></div>
          <div id="pf-mock-cart-empty" style="display:none">Your cart is empty</div>
          <div id="pf-mock-cart-summary">
            <div class="row"><span>Subtotal</span><strong class="subtotal">£0.00</strong></div>
            <button class="checkout" type="button">Go to Checkout</button>
          </div>
        </aside>`;
      document.body.appendChild(root);
      $$('#pf-mock-cart-fab').addEventListener('click', UI.open);
      $$('#pf-mock-cart-close').addEventListener('click', UI.close);
      $$('#pf-mock-cart-overlay').addEventListener('click', UI.close);
      $$('#pf-mock-cart-summary .checkout').addEventListener('click', ()=>alert('Mock checkout'));
    },
    open(){ UI.ensure(); $$('#pf-mock-cart-drawer').classList.add('open'); $$('#pf-mock-cart-overlay').classList.add('open'); },
    close(){ const d=$$('#pf-mock-cart-drawer'); if(d) d.classList.remove('open'); const o=$$('#pf-mock-cart-overlay'); if(o) o.classList.remove('open'); },
    ping(){
      UI.ensure();
      const fab = $$('#pf-mock-cart-fab');
      fab.style.transform='scale(1.06)'; setTimeout(()=>fab.style.transform='scale(1)',180);
    },
    update(){
      UI.ensure();
      const list = $$('#pf-mock-cart-list');
      const empty = $$('#pf-mock-cart-empty');
      const cnt = $$('#pf-mock-cart-fab .cnt');
      const subtotalEl = $$('#pf-mock-cart-summary .subtotal');
      const cart = Cart.get();
      cnt.textContent = String(Cart.count());
      subtotalEl.textContent = money(Cart.subtotal());
      if (!cart.length){ list.innerHTML=''; empty.style.display='block'; return; }
      empty.style.display='none';
      list.innerHTML = cart.map(it=>`<div class="pf-item" data-sku="${it.sku}">
          <img alt="${(it.title||'').replace(/</g,'&lt;')}" src="${it.img||''}">
          <div>
            <div class="title">${(it.title||'').replace(/</g,'&lt;')}</div>
            <div class="sku">SKU: ${it.sku}</div>
            <div class="qty">Qty: <input type="number" min="1" value="${it.qty}"></div>
          </div>
          <div>
            <div class="price">${money((it.price||0)* (it.qty||1))}</div>
            <button class="remove" type="button" style="margin-top:8px">Remove</button>
          </div>
        </div>`).join('');
      $$$('.pf-item input[type="number"]', list).forEach(inp=>{
        inp.addEventListener('change', e=>{
          const sku = e.target.closest('.pf-item').dataset.sku; Cart.updateQty(sku, e.target.value);
        });
      });
      $$$('.pf-item .remove', list).forEach(btn=>{
        btn.addEventListener('click', e=>{ const sku = e.target.closest('.pf-item').dataset.sku; Cart.remove(sku); });
      });
    }
  };

  window.MockCart = {
    addItem: (payload) => Cart.add(payload),
    open: UI.open,
    clear: Cart.clear,
    getCount: Cart.count,
    getSubtotal: Cart.subtotal
  };

  document.addEventListener('DOMContentLoaded', ()=>{ UI.ensure(); UI.update(); });
})();
