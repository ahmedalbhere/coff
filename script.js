// متغيرات عامة
let currentTable = null;
let orderItems = [];
let menuItems = {};

// عناصر DOM
const tableNumberInput = document.getElementById('tableNumber');
const startOrderBtn = document.getElementById('startOrderBtn');
const tableNumberDisplay = document.getElementById('tableNumberDisplay');
const menuSection = document.querySelector('.menu-section');
const orderSection = document.querySelector('.order-section');
const confirmationSection = document.querySelector('.confirmation-section');
const menuItemsContainer = document.getElementById('menuItems');
const orderItemsContainer = document.getElementById('orderItems');
const totalAmountElement = document.getElementById('totalAmount');
const submitOrderBtn = document.getElementById('submitOrderBtn');
const newOrderBtn = document.getElementById('newOrderBtn');
const categoryButtons = document.querySelectorAll('.category-btn');

// استمع لضغط زر بدء الطلب
startOrderBtn.addEventListener('click', () => {
    const tableNumber = tableNumberInput.value.trim();
    
    if (!tableNumber) {
        alert('من فضلك أدخل رقم الطاولة');
        return;
    }
    
    currentTable = tableNumber;
    tableNumberDisplay.textContent = `الطاولة رقم ${tableNumber}`;
    tableNumberInput.value = '';
    
    document.querySelector('.table-number-section').classList.add('hidden');
    menuSection.classList.remove('hidden');
    loadMenuItems();
});

// استمع لنقر أزرار التصنيفات
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        filterMenuItems(button.dataset.category);
    });
});

// استمع لضغط زر تأكيد الطلب
submitOrderBtn.addEventListener('click', () => {
    if (orderItems.length === 0) {
        alert('من فضلك أضف أصناف إلى طلبك');
        return;
    }
    
    const orderData = {
        tableNumber: currentTable,
        items: orderItems,
        total: calculateTotal(),
        status: 'جديد',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    // إرسال الطلب إلى قاعدة البيانات
    const newOrderRef = database.ref('orders').push();
    newOrderRef.set(orderData)
        .then(() => {
            orderSection.classList.add('hidden');
            confirmationSection.classList.remove('hidden');
            orderItems = [];
        })
        .catch(error => {
            console.error('Error submitting order:', error);
            alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
        });
});

// استمع لضغط زر طلب جديد
newOrderBtn.addEventListener('click', () => {
    confirmationSection.classList.add('hidden');
    document.querySelector('.table-number-section').classList.remove('hidden');
    currentTable = null;
});

// تحميل أصناف القائمة من Firebase
function loadMenuItems() {
    database.ref('menu').on('value', (snapshot) => {
        menuItems = snapshot.val() || {};
        renderMenuItems(menuItems);
    });
}

// عرض أصناف القائمة
function renderMenuItems(items) {
    menuItemsContainer.innerHTML = '';
    
    for (const [id, item] of Object.entries(items)) {
        const menuItemElement = document.createElement('div');
        menuItemElement.className = 'menu-item';
        menuItemElement.dataset.id = id;
        menuItemElement.dataset.category = item.category;
        
        menuItemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.price} ج.م</p>
            <div class="item-controls">
                <button class="decrease-btn">-</button>
                <span class="item-quantity">0</span>
                <button class="increase-btn">+</button>
                <button class="add-to-order-btn">إضافة</button>
            </div>
        `;
        
        menuItemsContainer.appendChild(menuItemElement);
    }
    
    // إضافة مستمعين للأحداث للأزرار الجديدة
    document.querySelectorAll('.increase-btn').forEach(btn => {
        btn.addEventListener('click', increaseQuantity);
    });
    
    document.querySelectorAll('.decrease-btn').forEach(btn => {
        btn.addEventListener('click', decreaseQuantity);
    });
    
    document.querySelectorAll('.add-to-order-btn').forEach(btn => {
        btn.addEventListener('click', addToOrder);
    });
}

// تصفية الأصناف حسب التصنيف
function filterMenuItems(category) {
    const allItems = document.querySelectorAll('.menu-item');
    
    allItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// زيادة الكمية
function increaseQuantity(e) {
    const quantityElement = e.target.nextElementSibling;
    let quantity = parseInt(quantityElement.textContent);
    quantityElement.textContent = quantity + 1;
}

// تقليل الكمية
function decreaseQuantity(e) {
    const quantityElement = e.target.nextElementSibling;
    let quantity = parseInt(quantityElement.textContent);
    
    if (quantity > 0) {
        quantityElement.textContent = quantity - 1;
    }
}

// إضافة إلى الطلب
function addToOrder(e) {
    const menuItemElement = e.target.closest('.menu-item');
    const itemId = menuItemElement.dataset.id;
    const quantity = parseInt(menuItemElement.querySelector('.item-quantity').textContent);
    
    if (quantity <= 0) {
        alert('من فضلك حدد الكمية');
        return;
    }
    
    const item = menuItems[itemId];
    const existingItemIndex = orderItems.findIndex(i => i.id === itemId);
    
    if (existingItemIndex !== -1) {
        orderItems[existingItemIndex].quantity += quantity;
    } else {
        orderItems.push({
            id: itemId,
            name: item.name,
            price: item.price,
            quantity: quantity
        });
    }
    
    // إعادة تعيين الكمية
    menuItemElement.querySelector('.item-quantity').textContent = '0';
    
    // عرض الطلب
    renderOrderItems();
    
    // إظهار قسم الطلب إذا كان مخفيًا
    if (orderSection.classList.contains('hidden')) {
        orderSection.classList.remove('hidden');
    }
}

// عرض أصناف الطلب
function renderOrderItems() {
    orderItemsContainer.innerHTML = '';
    
    orderItems.forEach((item, index) => {
        const orderItemElement = document.createElement('div');
        orderItemElement.className = 'order-item';
        
        orderItemElement.innerHTML = `
            <span>${item.name} × ${item.quantity}</span>
            <span>${item.price * item.quantity} ج.م</span>
            <button class="remove-item-btn" data-index="${index}">×</button>
        `;
        
        orderItemsContainer.appendChild(orderItemElement);
    });
    
    // تحديث المجموع
    totalAmountElement.textContent = `${calculateTotal()} ج.م`;
    
    // إضافة مستمعين للأحداث لأزرار الحذف
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', removeOrderItem);
    });
}

// إزالة صنف من الطلب
function removeOrderItem(e) {
    const index = parseInt(e.target.dataset.index);
    orderItems.splice(index, 1);
    renderOrderItems();
    
    if (orderItems.length === 0) {
        orderSection.classList.add('hidden');
    }
}

// حساب المجموع
function calculateTotal() {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// تهيئة الصفحة
function init() {
    // إظهار قسم إدخال رقم الطاولة فقط
    document.querySelector('.table-number-section').classList.remove('hidden');
    menuSection.classList.add('hidden');
    orderSection.classList.add('hidden');
    confirmationSection.classList.add('hidden');
}

init();
