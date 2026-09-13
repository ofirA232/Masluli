# Static destination images

The four local WebP assets were selected manually from Unsplash, separately from the application's Unsplash API integration. Source photographs:

| Asset | Destination | Source |
| --- | --- | --- |
| public/images/italy.webp | Cinque Terre, Italy | [Original image](https://images.unsplash.com/photo-1516483638261-f4dbaf036963) |
| public/images/paris.webp | Paris, France | [Original image](https://images.unsplash.com/photo-1502602898657-3e91760cbb34) |
| public/images/japan.webp | Kyoto, Japan | [Original image](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e) |
| public/images/iceland.webp | Iceland | [Original image](https://images.unsplash.com/photo-1476610182048-b716b8518aae) |

See the [Unsplash License](https://unsplash.com/license). These decorative assets are not representations of activity search results. The interface identifies the source as Unsplash.

Dynamic destination covers from `unsplash-image` use the API's original image URL, photographer profile and photo page with referral parameters, and download tracking. Keep those URLs and attribution intact. Google place photos are fetched separately, on demand, with the returned author and source links; they are not stored as local assets or in trip records.

The Planatrip wordmark, compass SVG, social preview SVG and decorative CSS were created for this project. No Wanderlog logo, illustration or screenshot is embedded in the application.
