/* ============================================================
   Royalty's Pens — app.js
   Shared interactivity: nav, cart, quick view, shop filter/sort,
   newsletter toast, sparkles
   ============================================================ */

/* ── Cart state ── */
let cartItems = JSON.parse(sessionStorage.getItem('rp_cart') || '[]');

function saveCart() {
  sessionStorage.setItem('rp_cart', JSON.stringify(cartItems));
}

/* ── Sticky nav shadow ── */
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  });
}

/* ── Hamburger / mobile nav ── */
const hamburger  = document.getElementById('hamburger');
const mobileNav  = document.getElementById('mobileNav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  // Close on link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Toast ── */
function showToast(msg, duration = 2800) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}
window.showToast = showToast;

/* ── Cart helpers ── */
function updateCartBadge() {
  const total = cartItems.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = total;
    el.style.display = total === 0 ? 'none' : 'flex';
  });
}

function renderCart() {
  const body   = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;

  if (cartItems.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">👜</div>
        <p>Your cart is empty.<br/>Add some royal pens!</p>
        <a href="shop.html" class="btn btn-purple btn-sm mt-2">Browse Collection</a>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  body.innerHTML = cartItems.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-img">
        <div style="width:100%;height:100%;background:${item.bg};display:flex;align-items:center;justify-content:center;font-size:1.6rem;">${item.emoji}</div>
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-idx="${idx}" data-action="dec">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-idx="${idx}" data-action="inc">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-idx="${idx}" aria-label="Remove">✕</button>
    </div>
  `).join('');

  // Qty & remove handlers
  body.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      if (btn.dataset.action === 'inc') cartItems[i].qty++;
      else cartItems[i].qty = Math.max(1, cartItems[i].qty - 1);
      saveCart(); renderCart(); updateCartBadge();
    });
  });
  body.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cartItems.splice(parseInt(btn.dataset.idx), 1);
      saveCart(); renderCart(); updateCartBadge();
    });
  });

  // Total
  const total = cartItems.reduce((s, i) => {
    const price = parseFloat(i.price.replace('$', ''));
    return s + price * i.qty;
  }, 0);
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  if (footer) footer.style.display = 'block';
}

/* ── Cart drawer open/close ── */
const cartBtn     = document.getElementById('cartBtn');
const cartDrawer  = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose   = document.getElementById('cartClose');

function openCart() {
  renderCart();
  cartDrawer?.classList.add('open');
  cartOverlay?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartDrawer?.classList.remove('open');
  cartOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

cartBtn?.addEventListener('click', openCart);
cartClose?.addEventListener('click', closeCart);
cartOverlay?.addEventListener('click', closeCart);

/* ── Add to Cart (all pages) ── */
function getCardData(btn) {
  const card = btn.closest('.product-card, .modal-info');
  if (!card) return null;
  const name  = card.dataset.name  || card.querySelector('#modalName')?.textContent  || 'Pen';
  const price = card.dataset.price || card.querySelector('#modalPrice')?.textContent || '$0.00';
  // Try to get bg from the product-art element
  const artEl = btn.closest('.product-card')?.querySelector('.product-art, .product-img-wrap > div');
  const bg    = artEl?.style?.background || 'linear-gradient(135deg,#4A1060,#9B59B6)';
  const emojiEl = artEl?.querySelector('text[font-size]') || artEl;
  // Fallback emoji by category
  const cat   = card.dataset.category || '';
  const emojiMap = { crystal:'💎', butterfly:'🦋', crown:'👑', floral:'🌸', character:'⭐', executive:'✒️', seasonal:'❄️' };
  const emoji = emojiMap[cat] || '💎';
  return { name, price, bg, emoji };
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.add-to-cart-btn, .modal-cart-btn');
  if (!btn) return;

  let name, price, bg, emoji;

  // product detail page (data attrs on button itself)
  if (btn.dataset.name) {
    name  = btn.dataset.name;
    price = btn.dataset.price;
    bg    = 'linear-gradient(135deg,#4A1060,#9B59B6)';
    emoji = '💎';
  } else {
    const d = getCardData(btn);
    if (!d) return;
    ({ name, price, bg, emoji } = d);
  }

  const existing = cartItems.find(i => i.name === name);
  if (existing) existing.qty++;
  else cartItems.push({ name, price, bg, emoji, qty: 1 });

  saveCart();
  updateCartBadge();
  showToast(`✨ ${name} added to cart!`);
});

/* ── Quick View modal ── */
const quickViewModal = document.getElementById('quickViewModal');
const modalClose     = document.getElementById('modalClose');
const modalName      = document.getElementById('modalName');
const modalPrice     = document.getElementById('modalPrice');
const modalDesc      = document.getElementById('modalDesc');
const modalImg       = document.getElementById('modalImg');

function openModal(card) {
  if (!quickViewModal) return;
  const name  = card.dataset.name  || 'Handcrafted Pen';
  const price = card.dataset.price || '$0.00';
  const desc  = card.dataset.desc  || '';
  const cat   = card.dataset.category || 'crystal';

  const emojiMap = { crystal:'💎', butterfly:'🦋', crown:'👑', floral:'🌸', character:'⭐', executive:'✒️', seasonal:'❄️' };
  const bgMap    = {
    crystal:'linear-gradient(135deg,#4A1060,#9B59B6)',
    butterfly:'linear-gradient(135deg,#3D1060,#FF69B4)',
    crown:'linear-gradient(135deg,#0D0D0D,#C9A84C)',
    floral:'linear-gradient(135deg,#6B1060,#FF85A1)',
    character:'linear-gradient(135deg,#1A0050,#7B2FBE)',
    executive:'linear-gradient(135deg,#050505,#2A2A2A)',
    seasonal:'linear-gradient(135deg,#1A4060,#89CFF0)',
  };

  if (modalName)  modalName.textContent  = name;
  if (modalPrice) modalPrice.textContent = price;
  if (modalDesc)  modalDesc.textContent  = desc;
  if (modalImg) {
    modalImg.style.background = bgMap[cat] || bgMap.crystal;
    modalImg.innerHTML = `<span style="font-size:5rem;">${emojiMap[cat] || '💎'}</span>`;
  }

  // Stash data on modal-cart-btn for add to cart
  const modalCartBtn = quickViewModal.querySelector('.modal-cart-btn');
  if (modalCartBtn) {
    modalCartBtn.closest('.modal-info').dataset.name     = name;
    modalCartBtn.closest('.modal-info').dataset.price    = price;
    modalCartBtn.closest('.modal-info').dataset.category = cat;
  }

  quickViewModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  quickViewModal?.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.quick-view-btn');
  if (btn) {
    const card = btn.closest('.product-card');
    if (card) openModal(card);
  }
});

modalClose?.addEventListener('click', closeModal);
quickViewModal?.addEventListener('click', e => {
  if (e.target === quickViewModal) closeModal();
});

/* ── Shop page: filter & sort ── */
const shopGrid = document.getElementById('shopGrid');
if (shopGrid) {
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const sortSelect   = document.getElementById('sortSelect');
  const resultsCount = document.getElementById('resultsCount');

  let activeFilter = 'all';

  // Pick up URL param on page load
  const urlFilter = new URLSearchParams(location.search).get('filter');
  if (urlFilter) {
    activeFilter = urlFilter;
    filterBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.filter === urlFilter);
    });
  }

  function applyFilterSort() {
    const cards = [...shopGrid.querySelectorAll('.product-card')];
    const sort  = sortSelect?.value || 'featured';

    // Filter
    cards.forEach(c => {
      const match = activeFilter === 'all' || c.dataset.category === activeFilter;
      c.style.display = match ? '' : 'none';
    });

    // Sort visible cards
    const visible = cards.filter(c => c.style.display !== 'none');
    visible.sort((a, b) => {
      if (sort === 'price-asc')  return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
      if (sort === 'price-desc') return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
      if (sort === 'newest')     return parseInt(b.dataset.date)    - parseInt(a.dataset.date);
      return 0; // featured — keep DOM order
    });
    visible.forEach(c => shopGrid.appendChild(c));

    if (resultsCount) {
      resultsCount.textContent = `Showing ${visible.length} pen${visible.length !== 1 ? 's' : ''}`;
    }
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilterSort();
    });
  });

  sortSelect?.addEventListener('change', applyFilterSort);

  applyFilterSort();
}

/* ── Newsletter form ── */
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', e => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input[type=email]');
    if (input?.value) {
      showToast('✨ Welcome to the Royal Court!');
      input.value = '';
    }
  });
}

/* ── Hero sparkle dots ── */
const sparkleContainer = document.getElementById('sparkles');
if (sparkleContainer) {
  const positions = [
    [10,15],[25,65],[80,20],[90,70],[50,10],[60,80],
    [15,85],[40,40],[70,55],[35,25],[85,45],[5,50],
    [55,90],[20,35],[75,15],[45,75],[30,60],[65,30],
  ];
  positions.forEach(([left, top], i) => {
    const dot = document.createElement('div');
    dot.className = 'sparkle-dot';
    dot.style.cssText = `left:${left}%;top:${top}%;animation-delay:${(i * 0.18).toFixed(2)}s;animation-duration:${(2.5 + (i % 4) * 0.4).toFixed(1)}s;width:${i % 3 === 0 ? 6 : 4}px;height:${i % 3 === 0 ? 6 : 4}px;`;
    sparkleContainer.appendChild(dot);
  });
}

/* ── Init ── */
updateCartBadge();
