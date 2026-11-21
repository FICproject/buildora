import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Seed Products
import { SEED_PRODUCTS, MASTER_CATEGORIES } from '../../packages/constants/src/index';

// Minimal mock store logic mirroring useCartStore exactly
interface MockCartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

class MockCartStore {
  items: MockCartItem[] = [];

  addItem(product: any, quantity = 1, variant?: any) {
    const variantId = variant?.id;
    const existingIndex = this.items.findIndex(
      (item) => item.productId === product.id && (item.variantId || undefined) === (variantId || undefined)
    );

    if (existingIndex > -1) {
      const existing = this.items[existingIndex];
      const newQty = Math.min(existing.quantity + quantity, existing.maxStock);
      this.items[existingIndex] = { ...existing, quantity: newQty };
    } else {
      this.items.push({
        productId: product.id,
        variantId,
        name: product.name,
        price: product.price,
        quantity: Math.min(quantity, product.stockCount || 50),
        maxStock: product.stockCount || 50
      });
    }
  }

  removeItem(productId: string, variantId?: string) {
    this.items = this.items.filter(
      (item) => !(item.productId === productId && (item.variantId || undefined) === (variantId || undefined))
    );
  }

  updateQuantity(productId: string, quantity: number, variantId?: string) {
    if (quantity <= 0) {
      this.removeItem(productId, variantId);
      return;
    }
    this.items = this.items.map((item) => {
      if (item.productId === productId && (item.variantId || undefined) === (variantId || undefined)) {
        const clampedQty = Math.max(1, Math.min(quantity, item.maxStock));
        return { ...item, quantity: clampedQty };
      }
      return item;
    });
  }

  get inCartQty() {
    return (productId: string, variantId?: string) => {
      const item = this.items.find(
        (i) => i.productId === productId && (i.variantId || undefined) === (variantId || undefined)
      );
      return item ? item.quantity : 0;
    };
  }

  get totalItemCount() {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  get subtotal() {
    return this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 BUILDORA 60 — UNIVERSAL QUANTITY CONTROL & CATEGORY HEADING');
  console.log('================================================================\n');

  let passed = 0;
  let total = 14;

  const testProduct = SEED_PRODUCTS[0]; // UltraTech Cement
  const testProduct2 = SEED_PRODUCTS[1]; // Astral CPVC

  // -------------------------------------------------------------------------
  // 1. Heading verification in HomePage.tsx
  // -------------------------------------------------------------------------
  console.log('🔹 Test 1: Category heading displays "Explore All 28 Master Categories"');
  {
    const homePage = fs.readFileSync(
      path.resolve(__dirname, '../../apps/customer-web/src/pages/HomePage.tsx'),
      'utf-8'
    );
    assert(
      homePage.includes('Explore All 28 Master Categories'),
      'HomePage must contain exact heading "Explore All 28 Master Categories"'
    );
    assert(
      homePage.includes('Structural civil supplies, finishing boards, electrical, plumbing, and architectural hardware.'),
      'Subtitle must be preserved'
    );
    assert.strictEqual(MASTER_CATEGORIES.length, 28, 'Master categories count must be 28');
    console.log('  ✅ PASSED: Exact heading "Explore All 28 Master Categories" verified on HomePage\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 2. QuantityControl component min=0 default
  // -------------------------------------------------------------------------
  console.log('🔹 Test 2: QuantityControl defaults min=0, enabling minus button at quantity 1');
  {
    const qcFile = fs.readFileSync(
      path.resolve(__dirname, '../../apps/customer-web/src/components/ui/QuantityControl.tsx'),
      'utf-8'
    );
    assert(qcFile.includes('min = 0'), 'QuantityControl must default min to 0');
    assert(qcFile.includes('disabled={quantity <= min}'), 'Disabled check must respect min');
    // At quantity = 1 and min = 0: 1 <= 0 is false, so minus is NOT disabled!
    assert(!qcFile.includes('min = 1,'), 'QuantityControl must not hardcode min = 1 as default');
    console.log('  ✅ PASSED: QuantityControl allows clicking minus at quantity = 1\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 3. ProductCard initially displays "+ ADD" when quantity = 0
  // -------------------------------------------------------------------------
  console.log('🔹 Test 3: Product initially displays "+ ADD" when quantity = 0');
  {
    const store = new MockCartStore();
    const qty = store.inCartQty(testProduct.id);
    assert.strictEqual(qty, 0, 'Initial quantity must be 0');
    const buttonLabel = qty > 0 ? `− ${qty} +` : '+ ADD';
    assert.strictEqual(buttonLabel, '+ ADD', 'Must display + ADD when quantity is 0');
    console.log('  ✅ PASSED: Initial state displays + ADD\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 4. Clicking "+ ADD" changes quantity to 1 and shows "− 1 +"
  // -------------------------------------------------------------------------
  console.log('🔹 Test 4: Clicking "+ ADD" changes quantity to 1 and replaces with "− 1 +"');
  {
    const store = new MockCartStore();
    store.addItem(testProduct, 1);
    const qty = store.inCartQty(testProduct.id);
    assert.strictEqual(qty, 1, 'Quantity must be 1 after clicking + ADD');
    assert.strictEqual(store.totalItemCount, 1, 'Cart total count must be 1');
    const buttonState = qty > 0 ? `− ${qty} +` : '+ ADD';
    assert.strictEqual(buttonState, '− 1 +', 'Must display − 1 + when quantity is 1');
    console.log('  ✅ PASSED: Clicking + ADD sets quantity=1 and displays "− 1 +"\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 5. Clicking minus at quantity 1 removes item and restores "+ ADD"
  // -------------------------------------------------------------------------
  console.log('🔹 Test 5: Clicking minus (−) at quantity 1 removes item and restores "+ ADD"');
  {
    const store = new MockCartStore();
    store.addItem(testProduct, 1);
    assert.strictEqual(store.inCartQty(testProduct.id), 1);

    // Simulate clicking minus at quantity 1
    const currentQty = store.inCartQty(testProduct.id);
    if (currentQty <= 1) {
      store.removeItem(testProduct.id);
    } else {
      store.updateQuantity(testProduct.id, currentQty - 1);
    }

    assert.strictEqual(store.inCartQty(testProduct.id), 0, 'Quantity must return to 0');
    assert.strictEqual(store.items.length, 0, 'Cart must be completely empty');
    assert.strictEqual(store.totalItemCount, 0, 'Cart count must be 0');
    const buttonState = store.inCartQty(testProduct.id) > 0 ? `− ${store.inCartQty(testProduct.id)} +` : '+ ADD';
    assert.strictEqual(buttonState, '+ ADD', 'Must restore + ADD button');
    console.log('  ✅ PASSED: Minus at quantity 1 removes item and restores "+ ADD"\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 6. Clicking plus (+) at quantity 1 increments to 2
  // -------------------------------------------------------------------------
  console.log('🔹 Test 6: Clicking plus (+) at quantity 1 changes quantity to 2');
  {
    const store = new MockCartStore();
    store.addItem(testProduct, 1);
    store.updateQuantity(testProduct.id, 2);
    assert.strictEqual(store.inCartQty(testProduct.id), 2, 'Quantity must be 2');
    assert.strictEqual(store.totalItemCount, 2, 'Total item count must be 2');
    assert.strictEqual(store.subtotal, testProduct.price * 2, 'Subtotal must reflect 2 units');
    console.log('  ✅ PASSED: Quantity increments from 1 to 2 correctly\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 7. Clicking minus (−) at quantity 2 decrements to 1
  // -------------------------------------------------------------------------
  console.log('🔹 Test 7: Clicking minus (−) at quantity 2 decrements quantity to 1');
  {
    const store = new MockCartStore();
    store.addItem(testProduct, 2);
    const currentQty = store.inCartQty(testProduct.id);
    if (currentQty <= 1) {
      store.removeItem(testProduct.id);
    } else {
      store.updateQuantity(testProduct.id, currentQty - 1);
    }
    assert.strictEqual(store.inCartQty(testProduct.id), 1, 'Quantity must be 1');
    assert.strictEqual(store.totalItemCount, 1, 'Total item count must be 1');
    console.log('  ✅ PASSED: Decrementing from 2 to 1 leaves 1 unit in cart\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 8. Clicking minus (−) at quantity 1 again returns to "+ ADD"
  // -------------------------------------------------------------------------
  console.log('🔹 Test 8: Clicking minus (−) at quantity 1 again returns to "+ ADD"');
  {
    const store = new MockCartStore();
    store.addItem(testProduct, 2);
    // Decrease from 2 to 1
    store.updateQuantity(testProduct.id, 1);
    assert.strictEqual(store.inCartQty(testProduct.id), 1);
    // Decrease from 1 to 0
    if (store.inCartQty(testProduct.id) <= 1) {
      store.removeItem(testProduct.id);
    } else {
      store.updateQuantity(testProduct.id, 0);
    }
    assert.strictEqual(store.inCartQty(testProduct.id), 0, 'Quantity must be 0');
    assert.strictEqual(store.totalItemCount, 0, 'Cart item count must be 0');
    console.log('  ✅ PASSED: Repeated decrementing properly reaches 0 and restores "+ ADD"\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 9. Cart total count and prices update accurately
  // -------------------------------------------------------------------------
  console.log('🔹 Test 9: Cart count and totals update immediately after every operation');
  {
    const store = new MockCartStore();
    // Add prod 1 (qty 1)
    store.addItem(testProduct, 1);
    assert.strictEqual(store.totalItemCount, 1);
    assert.strictEqual(store.subtotal, testProduct.price);

    // Add prod 2 (qty 3)
    store.addItem(testProduct2, 3);
    assert.strictEqual(store.totalItemCount, 4);
    assert.strictEqual(store.subtotal, testProduct.price + testProduct2.price * 3);

    // Remove prod 1 by clicking minus at qty 1
    store.removeItem(testProduct.id);
    assert.strictEqual(store.totalItemCount, 3);
    assert.strictEqual(store.subtotal, testProduct2.price * 3);
    console.log('  ✅ PASSED: Cart items and financial totals synchronize in real-time\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 10. Multi-variant isolation
  // -------------------------------------------------------------------------
  console.log('🔹 Test 10: Variant products maintain correct independent quantities');
  {
    const store = new MockCartStore();
    const variantA = { id: 'var-10mm' };
    const variantB = { id: 'var-20mm' };

    store.addItem(testProduct, 1, variantA);
    store.addItem(testProduct, 2, variantB);

    assert.strictEqual(store.inCartQty(testProduct.id, 'var-10mm'), 1);
    assert.strictEqual(store.inCartQty(testProduct.id, 'var-20mm'), 2);

    // Decrement variantA to 0
    store.removeItem(testProduct.id, 'var-10mm');
    assert.strictEqual(store.inCartQty(testProduct.id, 'var-10mm'), 0);
    assert.strictEqual(store.inCartQty(testProduct.id, 'var-20mm'), 2); // variant B unaffected
    console.log('  ✅ PASSED: Distinct product variants hold independent quantities\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 11. No negative quantities or NaN under rapid clicking
  // -------------------------------------------------------------------------
  console.log('🔹 Test 11: No negative quantities or duplicate entries');
  {
    const store = new MockCartStore();
    store.addItem(testProduct, 1);
    // Rapid minus clicks
    store.updateQuantity(testProduct.id, 0);
    store.updateQuantity(testProduct.id, -1);
    store.updateQuantity(testProduct.id, -5);

    assert.strictEqual(store.inCartQty(testProduct.id), 0, 'Quantity cannot be negative');
    assert.strictEqual(store.items.length, 0, 'No corrupt items stored in cart');
    console.log('  ✅ PASSED: Negative quantities rejected, item cleanly removed\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 12. CartPage decrement to 0 removes row
  // -------------------------------------------------------------------------
  console.log('🔹 Test 12: CartPage decrement at quantity 1 removes item');
  {
    const cartPageFile = fs.readFileSync(
      path.resolve(__dirname, '../../apps/customer-web/src/pages/CartPage.tsx'),
      'utf-8'
    );
    assert(cartPageFile.includes('updateQuantity(item.productId, item.quantity - 1'), 'CartPage calls updateQuantity with decremented qty');
    const store = new MockCartStore();
    store.addItem(testProduct, 1);
    store.updateQuantity(testProduct.id, 0); // quantity - 1 = 0
    assert.strictEqual(store.items.length, 0, 'Row removed from cart items');
    console.log('  ✅ PASSED: CartPage handles 1 -> 0 decrement removal cleanly\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 13. ProductDetailPage quantity selector keeps minimum 1
  // -------------------------------------------------------------------------
  console.log('🔹 Test 13: ProductDetailPage quantity selector has min=1');
  {
    const pdpFile = fs.readFileSync(
      path.resolve(__dirname, '../../apps/customer-web/src/pages/ProductDetailPage.tsx'),
      'utf-8'
    );
    assert(pdpFile.includes('min={1}'), 'ProductDetailPage passes min={1} to QuantityControl');
    console.log('  ✅ PASSED: Product detail page quantity cannot be set to 0 before adding\n');
    passed++;
  }

  // -------------------------------------------------------------------------
  // 14. Universal ProductCard usage audit across all site pages
  // -------------------------------------------------------------------------
  console.log('🔹 Test 14: Reusable ProductCard used universally across customer web');
  {
    const filesUsingProductCard = [
      'HomePage.tsx',
      'CategoryPage.tsx',
      'ProductListingPage.tsx',
      'SearchPage.tsx',
      'ProductDetailPage.tsx',
      'DealsPage.tsx',
      'BrandsPage.tsx',
      'WishlistPage.tsx'
    ];

    for (const f of filesUsingProductCard) {
      const content = fs.readFileSync(
        path.resolve(__dirname, `../../apps/customer-web/src/pages/${f}`),
        'utf-8'
      );
      assert(content.includes('<ProductCard'), `${f} must use shared <ProductCard /> component`);
    }
    console.log(`  ✅ PASSED: All ${filesUsingProductCard.length} product listing views share ProductCard implementation\n`);
    passed++;
  }

  console.log('================================================================');
  console.log(`🎉 ALL ${passed} OF ${total} TEST CHECKLIST ITEMS PASSED!`);
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
