-- Optional one-time seed/migration for the original demo orders.
-- Run supabase/orders.sql first. Re-runnable: rows are upserted by id.

insert into cinghouse.orders (id, placed_time, placed_time_full, customer_name, customer_phone, customer_email, branch, channel, items, subtotal, shipping_fee, service_fee, total, status, notes, table_ref, screenshot, created_by, created_by_avatar, history)
values
  ('#OH-8291', 'Oct 24, 2023', 'Oct 24, 2023 • 14:32 PM', 'Jane Doe', '+1 111 222 3333', 'jane.doe@gmail.com', 'Cing House Võ Cường', 'GrabFood', '[{"id":"RAM-004","name":"Spicy Miso Ramen","sku":"RAM-004","quantity":2,"price":120000,"subtotal":240000},{"id":"TEA-009","name":"Green Tea Matcha Blend","sku":"TEA-009","quantity":1,"price":25000,"subtotal":25000}]'::jsonb, 265000, 15000, null, 280000, 'NEW', 'Giao gấp trước 15h, ít ngọt trà xanh.', null, null, 'Admin_Manager_01', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpPGC1UAkRxACPRs4DTH6o8z3Bzi89HKvxmvnX4mOOjNKYhJeQTQVj9mBKgDpn4rWaSSDO3Rqqmx1qeyW0oweEu48NSp9Zo_u1JG7SC7vDr6-sl_zl4kHQqQOhRsVV30YNLCDr-xzvY3eMvaq2UxAX4aXPGk7g5hlOI_36AlGmf2tosuv3bB2g6rMvcWI85k9wDuSWRTNbffr5hKh_7yg29xlk6gkHcPoLdY9TJnKkD_rkpIUI8kJVS4qv--CuP-45z_qjo3RJC4I', '[{"id":"log-1","actor":"System (Webhook)","action":"Order created via GrabFood integration","timestamp":"14:32 24/10"}]'::jsonb),
  ('#OH-8290', 'Oct 24, 2023', 'Oct 24, 2023 • 14:15 PM', 'Mike Smith', '+1 444 555 6666', 'mike.smith@yahoo.com', 'Cing House Nguyễn Gia Thiều', 'Dine-In', '[{"id":"BUR-005","name":"Classic Wagyu Burger XL","sku":"BUR-005","quantity":1,"price":145000,"subtotal":145000},{"id":"FRI-006","name":"Truffle Parmesan Fries","sku":"FRI-006","quantity":1,"price":65000,"subtotal":65000}]'::jsonb, 210000, 0, null, 210000, 'PROCESSING', 'No onions in the burger, please.', 'Table T-08', null, 'Admin_Manager_01', null, '[{"id":"log-2","actor":"Chef Marco","action":"changed status to Processing","timestamp":"14:15 24/10"},{"id":"log-1","actor":"System (Dine-In POS)","action":"Order created","timestamp":"14:10 24/10"}]'::jsonb),
  ('#OH-8288', 'Oct 24, 2023', 'Oct 24, 2023 • 13:50 PM', 'Anna Rice', '+1 777 888 9999', 'anna.rice@hotmail.com', 'Cing House Võ Cường', 'Takeaway', '[{"id":"PIZ-007","name":"Margarita Pizza","sku":"PIZ-007","quantity":3,"price":180000,"subtotal":540000}]'::jsonb, 540000, 0, null, 540000, 'COMPLETED', 'Extra cheese on all pizzas.', null, null, 'Admin_Manager_01', null, '[{"id":"log-4","actor":"MKT Team","action":"changed status to Completed","timestamp":"14:20 24/10"},{"id":"log-3","actor":"Chef Marco","action":"changed status to Processing","timestamp":"13:55 24/10"},{"id":"log-2","actor":"System","action":"Order created via Takeaway App","timestamp":"13:50 24/10"}]'::jsonb),
  ('#OH-8285', 'Oct 24, 2023', 'Oct 24, 2023 • 12:30 PM', 'Tom King', '+1 999 000 1111', 'tom.king@outlook.com', 'Cing House Võ Cường', 'UberEats', '[{"id":"PLA-008","name":"Family Platter","sku":"PLA-008","quantity":1,"price":350,"subtotal":350000}]'::jsonb, 350000, 25000, null, 375000, 'CANCELLED', 'Customer cancelled via third-party app.', null, null, 'Admin_Manager_01', null, '[{"id":"log-2","actor":"System (UberEats API)","action":"Order status changed to Cancelled (Customer Cancelled)","timestamp":"12:35 24/10"},{"id":"log-1","actor":"System (UberEats API)","action":"Order created","timestamp":"12:30 24/10"}]'::jsonb),
  ('#ORD-8829', 'Oct 12, 2023', 'Oct 12, 2023 • 12:45 PM', 'Jonathan Wick', '+1 234 567 8901', 'j.wick@continental.com', 'Cing House Nguyễn Gia Thiều', 'Direct Message (IG)', '[{"id":"BUR-099","name":"Classic Wagyu Burger","sku":"BUR-099","quantity":2,"price":330000,"subtotal":660000},{"id":"FRI-099","name":"Truffle Parmesan Fries","sku":"FRI-099","quantity":1,"price":180000,"subtotal":180000},{"id":"MAT-099","name":"Iced Matcha Latte","sku":"MAT-099","quantity":2,"price":145000,"subtotal":290000}]'::jsonb, 1130000, 0, 113000, 1243000, 'PROCESSING', 'Please cut burgers in half. Deliver immediately.', 'T-04 / #DM_882', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFROfYpY49XA371zE4lQ1OzjseIuujNWfC-bSlmoYP96TimhS8euGXbYhXZglU8Dl02qt4KTISHxWsufW5coAzLmfhnOYufR7vjc_SnYGqCEFp5Gntr5chEKxF0ZZ7wJKAEiWmobSg0O622fHpMIbuZWNFteC_Pn5Nyg3LpfKJ56BWUI7LVB1fPXjlX9GiAcfks88AZQm5bQyoutVS0BlFX2Vhr7fKAWallvS47sJQmdKEkH-SpHGX6qwVjdMxv4aXNzvyulb50Bk', 'Admin_Manager_01', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpPGC1UAkRxACPRs4DTH6o8z3Bzi89HKvxmvnX4mOOjNKYhJeQTQVj9mBKgDpn4rWaSSDO3Rqqmx1qeyW0oweEu48NSp9Zo_u1JG7SC7vDr6-sl_zl4kHQqQOhRsVV30YNLCDr-xzvY3eMvaq2UxAX4aXPGk7g5hlOI_36AlGmf2tosuv3bB2g6rMvcWI85k9wDuSWRTNbffr5hKh_7yg29xlk6gkHcPoLdY9TJnKkD_rkpIUI8kJVS4qv--CuP-45z_qjo3RJC4I', '[{"id":"log-3","actor":"MKT Team","action":"changed status to Completed","timestamp":"14:20 10/10"},{"id":"log-2","actor":"Chef Marco","action":"changed status to Processing","timestamp":"12:50 10/10"},{"id":"log-1","actor":"System (IG Webhook)","action":"Order created","timestamp":"12:45 10/10"}]'::jsonb)
on conflict (id) do update set
  placed_time = excluded.placed_time,
  placed_time_full = excluded.placed_time_full,
  customer_name = excluded.customer_name,
  customer_phone = excluded.customer_phone,
  customer_email = excluded.customer_email,
  branch = excluded.branch,
  channel = excluded.channel,
  items = excluded.items,
  subtotal = excluded.subtotal,
  shipping_fee = excluded.shipping_fee,
  service_fee = excluded.service_fee,
  total = excluded.total,
  status = excluded.status,
  notes = excluded.notes,
  table_ref = excluded.table_ref,
  screenshot = excluded.screenshot,
  created_by = excluded.created_by,
  created_by_avatar = excluded.created_by_avatar,
  history = excluded.history;
