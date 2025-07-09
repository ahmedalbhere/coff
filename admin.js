// عناصر DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const ordersList = document.getElementById('ordersList');
const menuItemsAdmin = document.getElementById('menuItemsAdmin');
const addItemBtn = document.getElementById('addItemBtn');
const itemNameInput = document.getElementById('itemName');
const itemCategorySelect = document.getElementById('itemCategory');
const itemPriceInput = document.getElementById('itemPrice');

// استمع لنقر أزرار التبويبات
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        tabContents.forEach(content => content.classList.add('hidden'));
        document.getElementById(`${tabId}Tab`).classList.remove('hidden');
    });
});

// تحميل الطلبات
function loadOrders() {
    database.ref('orders').orderByChild('timestamp').on('value', (snapshot) => {
        ordersList.innerHTML = '';
        const orders = snapshot.val() || {};
        
        for (const [id, order] of Object.entries(orders)) {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            orderCard.innerHTML = `
                <h3>الطاولة رقم ${order.tableNumber}</h3>
                <div class="order-items-list">
                    ${order.items.map(item => `
                        <div class="order-item-admin">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>${item.price * item.quantity} ج.م</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-status">
                    <p>الحالة: ${order.status}</p>
                    <p>المجموع: ${order.total} ج.م</p>
                    <div class="order-actions">
                        <select class="status-select" data-order-id="${id}">
                            <option value="جديد" ${order.status === 'جديد' ? 'selected' : ''}>جديد</option>
                            <option value="قيد التحضير" ${order.status === 'قيد التحضير' ? 'selected' : ''}>قيد التحضير</option>
                            <option value="تم التوصيل" ${order.status === 'تم التوصيل' ? 'selected' : ''}>تم التوصيل</option>
                            <option value="ملغي" ${order.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
                        </select>
                        <button class="delete-order-btn" data-order-id="${id}">حذف</button>
                    </div>
                </div>
            `;
            
            ordersList.appendChild(orderCard);
        }
        
        // إضافة مستمعين للأحداث
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', updateOrderStatus);
        });
        
        document.querySelectorAll('.delete-order-btn').forEach(btn => {
            btn.addEventListener('click', deleteOrder);
        });
    });
}

// تحديث حالة الطلب
function updateOrderStatus(e) {
    const orderId = e.target.dataset.orderId;
    const newStatus = e.target.value;
    
    database.ref(`orders/${orderId}/status`).set(newStatus)
        .catch(error => {
            console.error('Error updating order status:', error);
            alert('حدث خطأ أثناء تحديث حالة الطلب');
        });
}

// حذف الطلب
function deleteOrder(e) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    const orderId = e.target.dataset.orderId;
    database.ref(`orders/${orderId}`).remove()
        .catch(error => {
            console.error('Error deleting order:', error);
            alert('حدث خطأ أثناء حذف الطلب');
        });
}

// تحميل أصناف القائمة للإدارة
function loadMenuItemsForAdmin() {
    database.ref('menu').on('value', (snapshot) => {
        menuItemsAdmin.innerHTML = '';
        const items = snapshot.val() || {};
        
        for (const [id, item] of Object.entries(items)) {
            const menuItemElement = document.createElement('div');
            menuItemElement.className = 'menu-item-admin';
            
            menuItemElement.innerHTML = `
                <span>${item.name} (${getCategoryName(item.category)})</span>
                <span>${item.price} ج.م</span>
                <div>
                    <button class="edit-btn" data-item-id="${id}">تعديل</button>
                    <button class="delete-btn" data-item-id="${id}">حذف</button>
                </div>
            `;
            
            menuItemsAdmin.appendChild(menuItemElement);
        }
        
        // إضافة مستمعين للأحداث
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', editMenuItem);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteMenuItem);
        });
    });
}

// الحصول على اسم التصنيف
function getCategoryName(categoryKey) {
    const categories = {
        'hot': 'مشروبات ساخنة',
        'cold': 'مشروبات باردة',
        'food': 'وجبات'
    };
    
    return categories[categoryKey] || categoryKey;
}

// إضافة صنف جديد
addItemBtn.addEventListener('click', () => {
    const name = itemNameInput.value.trim();
    const category = itemCategorySelect.value;
    const price = parseFloat(itemPriceInput.value);
    
    if (!name || isNaN(price) || price <= 0) {
        alert('من فضلك أدخل بيانات صحيحة');
        return;
    }
    
    const newItem = {
        name: name,
        category: category,
        price: price
    };
    
    database.ref('menu').push(newItem)
        .then(() => {
            itemNameInput.value = '';
            itemPriceInput.value = '';
        })
        .catch(error => {
            console.error('Error adding menu item:', error);
            alert('حدث خطأ أثناء إضافة الصنف');
        });
});

// تعديل صنف
function editMenuItem(e) {
    const itemId = e.target.dataset.itemId;
    const currentItem = database.ref(`menu/${itemId}`);
    
    currentItem.once('value').then(snapshot => {
        const item = snapshot.val();
        
        const newName = prompt('اسم الصنف:', item.name);
        if (newName === null) return;
        
        const newPrice = prompt('السعر:', item.price);
        if (newPrice === null) return;
        
        const priceValue = parseFloat(newPrice);
        if (isNaN(priceValue) {
            alert('من فضلك أدخل سعرًا صحيحًا');
            return;
        }
        
        currentItem.update({
            name: newName.trim(),
            price: priceValue
        }).catch(error => {
            console.error('Error updating menu item:', error);
            alert('حدث خطأ أثناء تحديث الصنف');
        });
    });
}

// حذف صنف
function deleteMenuItem(e) {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
    
    const itemId = e.target.dataset.itemId;
    database.ref(`menu/${itemId}`).remove()
        .catch(error => {
            console.error('Error deleting menu item:', error);
            alert('حدث خطأ أثناء حذف الصنف');
        });
}

// تهيئة الصفحة
function init() {
    loadOrders();
    loadMenuItemsForAdmin();
}

init();
