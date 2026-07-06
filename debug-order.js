async function test() {
    const API_URL = 'http://localhost:5000/api';

    // 1. Get shops to use a valid shop and food ID
    const shopsRes = await fetch(`${API_URL}/shops`);
    const shops = await shopsRes.json();
    if (shops.length === 0) {
        console.error('No shops found in database.');
        return;
    }
    const shopId = shops[0]._id || shops[0].id;
    console.log('Using shopId:', shopId);

    // Get foods for this shop
    const foodsRes = await fetch(`${API_URL}/foods?shopId=${shopId}`);
    const foods = await foodsRes.json();
    if (foods.length === 0) {
        console.error('No foods found for shop:', shopId);
        return;
    }
    const food = foods[0];
    console.log('Using food:', food.name, 'id:', food.id);

    // 2. Login
    const loginRes = await fetch(`${API_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in. Token retrieved.');

    // 3. Place Order payload matching CartPage.tsx
    const payload = {
        shopId: shopId,
        items: [
            {
                id: food.id,
                shopId: shopId,
                name: food.name,
                price: food.price,
                quantity: 2,
                image: food.image
            }
        ],
        totalAmount: food.price * 2 + 3.99 + (food.price * 2 * 0.08),
        customerLocation: { lat: 40.715, lng: -74.01, address: '123 Main St, Apt 4B' },
    };

    const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
    });

    console.log('Response Status:', res.status);
    const data = await res.json().catch(async () => ({ text: await res.text() }));
    console.log('Response Body:', JSON.stringify(data, null, 2));
}

test().catch(console.error);
