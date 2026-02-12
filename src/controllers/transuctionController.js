/*
GET /transactions/:id
GET /transactions/user/:id     (admin)
GET /transactions/instructor/:id (admin)
GET /transactions/platform     (admin)
GET /transactions/platform/revenue
GET /transactions/platform/revenue?from=2026-01-01&to=2026-02-01
*/

// optional
/*
-> should trans be 
    reason = 'platform_profit'
    status = 'completed'

GET /analytics/platform-revenue
GET /analytics/platform-revenue?groupBy=day
GET /analytics/platform-revenue?groupBy=month
GET /analytics/platform-revenue?currency=EGP
GET /analytics/platform-revenue?from=2026-01-01&to=2026-02-01
*/
