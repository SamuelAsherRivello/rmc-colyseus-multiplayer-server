# Garden Chat implementation plan

Add isolated garden-chat room (12 seats) to the existing backend. Reuse client admission, status, fresh reconnect and identity lifecycle. Preserve drawing behavior. Movement is authoritative at 20 Hz, speed 3.4 units/second, radius 0.5, bounds x +/-7.5 and z +/-10.5. Inputs expire after 300 ms. Chat accepts 280 characters, rate limits sends to one per 750 ms and retains 100 entries for the running room. No durable identity/history. Local pause sends zero input and never resets the room.

Acceptance: two-client synchronization, collision, bounds, malicious input, history, late join, drop, fresh reconnect, full-room retry, drawing isolation and regression. Release client/server before frontend, then run live tests. Hosting remains experimental with roughly five-minute function lifetime.
