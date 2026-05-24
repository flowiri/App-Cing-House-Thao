import { Order } from './types';

export const INITIAL_ORDERS: Order[] = [
  {
    id: '#OH-8291',
    placedTime: 'Oct 24, 2023',
    placedTimeFull: 'Oct 24, 2023 • 14:32 PM',
    customerName: 'Jane Doe',
    customerPhone: '+1 111 222 3333',
    customerEmail: 'jane.doe@gmail.com',
    branch: 'Quận 1',
    channel: 'GrabFood',
    items: [
      { id: 'RAM-004', name: 'Spicy Miso Ramen', sku: 'RAM-004', quantity: 2, price: 120000, subtotal: 240000 },
      { id: 'TEA-009', name: 'Green Tea Matcha Blend', sku: 'TEA-009', quantity: 1, price: 25000, subtotal: 25000 }
    ],
    subtotal: 265000,
    shippingFee: 15000,
    total: 280000,
    status: 'NEW',
    notes: 'Giao gấp trước 15h, ít ngọt trà xanh.',
    createdBy: 'Admin_Manager_01',
    createdByAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpPGC1UAkRxACPRs4DTH6o8z3Bzi89HKvxmvnX4mOOjNKYhJeQTQVj9mBKgDpn4rWaSSDO3Rqqmx1qeyW0oweEu48NSp9Zo_u1JG7SC7vDr6-sl_zl4kHQqQOhRsVV30YNLCDr-xzvY3eMvaq2UxAX4aXPGk7g5hlOI_36AlGmf2tosuv3bB2g6rMvcWI85k9wDuSWRTNbffr5hKh_7yg29xlk6gkHcPoLdY9TJnKkD_rkpIUI8kJVS4qv--CuP-45z_qjo3RJC4I',
    history: [
      { id: 'log-1', actor: 'System (Webhook)', action: 'Order created via GrabFood integration', timestamp: '14:32 24/10' }
    ]
  },
  {
    id: '#OH-8290',
    placedTime: 'Oct 24, 2023',
    placedTimeFull: 'Oct 24, 2023 • 14:15 PM',
    customerName: 'Mike Smith',
    customerPhone: '+1 444 555 6666',
    customerEmail: 'mike.smith@yahoo.com',
    branch: 'Quận 3',
    channel: 'Dine-In',
    items: [
      { id: 'BUR-005', name: 'Classic Wagyu Burger XL', sku: 'BUR-005', quantity: 1, price: 145000, subtotal: 145000 },
      { id: 'FRI-006', name: 'Truffle Parmesan Fries', sku: 'FRI-006', quantity: 1, price: 65000, subtotal: 65000 }
    ],
    subtotal: 210000,
    shippingFee: 0,
    total: 210000,
    status: 'PROCESSING',
    notes: 'No onions in the burger, please.',
    tableRef: 'Table T-08',
    createdBy: 'Admin_Manager_01',
    history: [
      { id: 'log-2', actor: 'Chef Marco', action: 'changed status to Processing', timestamp: '14:15 24/10' },
      { id: 'log-1', actor: 'System (Dine-In POS)', action: 'Order created', timestamp: '14:10 24/10' }
    ]
  },
  {
    id: '#OH-8288',
    placedTime: 'Oct 24, 2023',
    placedTimeFull: 'Oct 24, 2023 • 13:50 PM',
    customerName: 'Anna Rice',
    customerPhone: '+1 777 888 9999',
    customerEmail: 'anna.rice@hotmail.com',
    branch: 'Quận 1',
    channel: 'Takeaway',
    items: [
      { id: 'PIZ-007', name: 'Margarita Pizza', sku: 'PIZ-007', quantity: 3, price: 180000, subtotal: 540000 }
    ],
    subtotal: 540000,
    shippingFee: 0,
    total: 540000,
    status: 'COMPLETED',
    notes: 'Extra cheese on all pizzas.',
    createdBy: 'Admin_Manager_01',
    history: [
      { id: 'log-4', actor: 'MKT Team', action: 'changed status to Completed', timestamp: '14:20 24/10' },
      { id: 'log-3', actor: 'Chef Marco', action: 'changed status to Processing', timestamp: '13:55 24/10' },
      { id: 'log-2', actor: 'System', action: 'Order created via Takeaway App', timestamp: '13:50 24/10' }
    ]
  },
  {
    id: '#OH-8285',
    placedTime: 'Oct 24, 2023',
    placedTimeFull: 'Oct 24, 2023 • 12:30 PM',
    customerName: 'Tom King',
    customerPhone: '+1 999 000 1111',
    customerEmail: 'tom.king@outlook.com',
    branch: 'Bình Thạnh',
    channel: 'UberEats',
    items: [
      { id: 'PLA-008', name: 'Family Platter', sku: 'PLA-008', quantity: 1, price: 350.000, subtotal: 350000 }
    ],
    subtotal: 350000,
    shippingFee: 25000,
    total: 375000,
    status: 'CANCELLED',
    notes: 'Customer cancelled via third-party app.',
    createdBy: 'Admin_Manager_01',
    history: [
      { id: 'log-2', actor: 'System (UberEats API)', action: 'Order status changed to Cancelled (Customer Cancelled)', timestamp: '12:35 24/10' },
      { id: 'log-1', actor: 'System (UberEats API)', action: 'Order created', timestamp: '12:30 24/10' }
    ]
  },
  // Order we can use to showcase order details screen exactly as Screen 4
  {
    id: '#ORD-8829',
    placedTime: 'Oct 12, 2023',
    placedTimeFull: 'Oct 12, 2023 • 12:45 PM',
    customerName: 'Jonathan Wick',
    customerPhone: '+1 234 567 8901',
    customerEmail: 'j.wick@continental.com',
    branch: 'Downtown Central',
    channel: 'Direct Message (IG)',
    tableRef: 'T-04 / #DM_882',
    items: [
      { id: 'BUR-099', name: 'Classic Wagyu Burger', sku: 'BUR-099', quantity: 2, price: 330000, subtotal: 660000 },
      { id: 'FRI-099', name: 'Truffle Parmesan Fries', sku: 'FRI-099', quantity: 1, price: 180000, subtotal: 180000 },
      { id: 'MAT-099', name: 'Iced Matcha Latte', sku: 'MAT-099', quantity: 2, price: 145000, subtotal: 290000 }
    ],
    subtotal: 1130000,
    shippingFee: 0,
    serviceFee: 113000, // 10%
    total: 1243000, // 1.243.000 đ
    status: 'PROCESSING',
    notes: 'Please cut burgers in half. Deliver immediately.',
    screenshot: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFROfYpY49XA371zE4lQ1OzjseIuujNWfC-bSlmoYP96TimhS8euGXbYhXZglU8Dl02qt4KTISHxWsufW5coAzLmfhnOYufR7vjc_SnYGqCEFp5Gntr5chEKxF0ZZ7wJKAEiWmobSg0O622fHpMIbuZWNFteC_Pn5Nyg3LpfKJ56BWUI7LVB1fPXjlX9GiAcfks88AZQm5bQyoutVS0BlFX2Vhr7fKAWallvS47sJQmdKEkH-SpHGX6qwVjdMxv4aXNzvyulb50Bk',
    createdBy: 'Admin_Manager_01',
    createdByAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpPGC1UAkRxACPRs4DTH6o8z3Bzi89HKvxmvnX4mOOjNKYhJeQTQVj9mBKgDpn4rWaSSDO3Rqqmx1qeyW0oweEu48NSp9Zo_u1JG7SC7vDr6-sl_zl4kHQqQOhRsVV30YNLCDr-xzvY3eMvaq2UxAX4aXPGk7g5hlOI_36AlGmf2tosuv3bB2g6rMvcWI85k9wDuSWRTNbffr5hKh_7yg29xlk6gkHcPoLdY9TJnKkD_rkpIUI8kJVS4qv--CuP-45z_qjo3RJC4I',
    history: [
      { id: 'log-3', actor: 'MKT Team', action: 'changed status to Completed', timestamp: '14:20 10/10' },
      { id: 'log-2', actor: 'Chef Marco', action: 'changed status to Processing', timestamp: '12:50 10/10' },
      { id: 'log-1', actor: 'System (IG Webhook)', action: 'Order created', timestamp: '12:45 10/10' }
    ]
  }
];

export const BRANCHES = ['Quận 1', 'Quận 3', 'Bình Thạnh', 'Downtown Central', 'Uptown Hub', 'Westside Outlet'];

export const CHANNELS = ['Facebook', 'Instagram', 'Zalo', 'GrabFood', 'Dine-In', 'Takeaway', 'UberEats', 'Direct Message (IG)'];
