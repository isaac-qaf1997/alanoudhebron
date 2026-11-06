# Opost setup for Alanoud Hebron

The Opost adapter is provider-specific and sends `multipart/form-data` to `POST https://o.opost.ps/api/resources/shipments`. It does not use the generic JSON `/shipments` adapter.

## Account identifiers already verified
- Business: `586` — العنود للزي الشرعي
- Pickup address: `588` — راس الجورة، الخليل
- Shipment type: `1` — ملابس
- Opost API base: `https://o.opost.ps`

These identifiers are defaults in the adapter and can be overridden with environment variables.

## Required server environment variables
Set these only in the hosting provider's encrypted environment settings (never commit tokens):
- `OPOST_ACCESS_TOKEN` — bearer access token for the Alanoud business account
- `OPOST_BUSINESS_ID=586`
- `OPOST_BUSINESS_ADDRESS_ID=588`
- `OPOST_SHIPMENT_TYPE_ID=1`
- Optional parcel dimensions: `OPOST_DEFAULT_WIDTH=10`, `OPOST_DEFAULT_HEIGHT=10`, `OPOST_DEFAULT_LENGTH=10`

## Courier record
In the admin courier settings, configure the courier with integration key exactly `opost`, active=true, API enabled=true. Do not enable automatic dispatch until the account token and test address mapping have been verified.

## Address mapping and safety
- Checkout stores city and area/neighborhood separately.
- Before creating a shipment, the adapter fetches Opost cities, resolves the submitted city by normalized Arabic/English label, fetches areas for that exact city ID, and resolves the submitted area.
- If the city or area cannot be matched exactly, the shipment is not sent; the order is retained and marked failed with an actionable error.
- The API requires multipart fields: business, business_address, consignee[name], consignee[phone], consignee[city], consignee[area], consignee[address], shipment_types[0][id], quantity, items_description, is_cod, width, height, length, cod_amount.
- COD amount is order total minus recorded amount paid. A fully paid order is sent as non-COD.
- The adapter never runs a real Opost POST in CI. Do not create a live shipment for testing.
- Opost's area endpoint previously returned an unexpected city list for one test city. The adapter therefore refuses to guess IDs. Verify live city/area lookup results before enabling dispatch for customers.

## Operational note
Opost credentials must be rotated if they were ever pasted into a public repository, issue, or chat. Use encrypted environment variables, not source code or database plaintext.
