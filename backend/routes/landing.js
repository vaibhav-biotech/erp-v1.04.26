const express = require('express');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const {
  getPublicBanners,
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  getPublicTopPicks,
  getAdminTopPicks,
  updateAdminTopPicks,
  getPublicOffers,
  getPublicOfferProducts,
  getAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getPublicOfferBackgrounds,
  getAdminOfferBackgrounds,
  createOfferBackground,
  updateOfferBackground,
  deleteOfferBackground,
  getPublicCategorySections,
  getAdminCategorySections,
  createCategorySection,
  updateCategorySection,
  getPublicFeaturedCollections,
  getAdminFeaturedCollections,
  createFeaturedCollection,
  updateFeaturedCollection,
  getPublicFeaturedCollectionBackgrounds,
  getAdminFeaturedCollectionBackgrounds,
  createFeaturedCollectionBackground,
  updateFeaturedCollectionBackground,
  deleteFeaturedCollectionBackground,
  getPublicGiftSection,
  getAdminGiftSection,
  createGiftSection,
  updateGiftSection,
  getPublicCareSection,
  getAdminCareSection,
  createCareImage,
  updateCareImage,
  getPublicWebsiteLogo,
  getAdminWebsiteLogo,
  createWebsiteLogo,
  updateWebsiteLogo,
  deleteWebsiteLogo,
  getPublicStaticPage,
  getAdminStaticPages,
  upsertAdminStaticPage,
  getPublicFooterSettingsConfig,
  getAdminFooterSettingsConfig,
  updateAdminFooterSettingsConfig,
} = require('../controllers/landing.controller');

const router = express.Router();

router.get('/banners', getPublicBanners);
router.get('/banners/admin', verifyAdminToken, getAdminBanners);
router.post('/banners', verifyAdminToken, createBanner);
router.patch('/banners/reorder', verifyAdminToken, reorderBanners);
router.patch('/banners/:bannerId', verifyAdminToken, updateBanner);
router.delete('/banners/:bannerId', verifyAdminToken, deleteBanner);
router.get('/top-picks', getPublicTopPicks);
router.get('/top-picks/admin', verifyAdminToken, getAdminTopPicks);
router.put('/top-picks/admin', verifyAdminToken, updateAdminTopPicks);
router.get('/offers', getPublicOffers);
router.get('/offers/admin', verifyAdminToken, getAdminOffers);
router.get('/offers/backgrounds', getPublicOfferBackgrounds);
router.get('/offers/backgrounds/admin', verifyAdminToken, getAdminOfferBackgrounds);
router.post('/offers/backgrounds', verifyAdminToken, createOfferBackground);
router.patch('/offers/backgrounds/:backgroundId', verifyAdminToken, updateOfferBackground);
router.delete('/offers/backgrounds/:backgroundId', verifyAdminToken, deleteOfferBackground);
router.get('/category-section', getPublicCategorySections);
router.get('/category-section/admin', verifyAdminToken, getAdminCategorySections);
router.post('/category-section/admin', verifyAdminToken, createCategorySection);
router.patch('/category-section/admin/:itemId', verifyAdminToken, updateCategorySection);
router.get('/featured-collections', getPublicFeaturedCollections);
router.get('/featured-collections/admin', verifyAdminToken, getAdminFeaturedCollections);
router.post('/featured-collections/admin', verifyAdminToken, createFeaturedCollection);
router.patch('/featured-collections/admin/:itemId', verifyAdminToken, updateFeaturedCollection);
router.get('/featured-collections/backgrounds', getPublicFeaturedCollectionBackgrounds);
router.get('/featured-collections/backgrounds/admin', verifyAdminToken, getAdminFeaturedCollectionBackgrounds);
router.post('/featured-collections/backgrounds', verifyAdminToken, createFeaturedCollectionBackground);
router.patch('/featured-collections/backgrounds/:backgroundId', verifyAdminToken, updateFeaturedCollectionBackground);
router.delete('/featured-collections/backgrounds/:backgroundId', verifyAdminToken, deleteFeaturedCollectionBackground);
router.get('/gift-section', getPublicGiftSection);
router.get('/gift-section/admin', verifyAdminToken, getAdminGiftSection);
router.post('/gift-section/admin', verifyAdminToken, createGiftSection);
router.patch('/gift-section/admin/:itemId', verifyAdminToken, updateGiftSection);
router.get('/care-section', getPublicCareSection);
router.get('/care-section/admin', verifyAdminToken, getAdminCareSection);
router.post('/care-section/admin', verifyAdminToken, createCareImage);
router.patch('/care-section/admin/:itemId', verifyAdminToken, updateCareImage);
router.get('/website-logo', getPublicWebsiteLogo);
router.get('/website-logo/admin', verifyAdminToken, getAdminWebsiteLogo);
router.post('/website-logo/admin', verifyAdminToken, createWebsiteLogo);
router.put('/website-logo/admin/:logoId', verifyAdminToken, updateWebsiteLogo);
router.patch('/website-logo/admin/:logoId', verifyAdminToken, updateWebsiteLogo);
router.delete('/website-logo/admin/:logoId', verifyAdminToken, deleteWebsiteLogo);
router.get('/static-pages/admin', verifyAdminToken, getAdminStaticPages);
router.put('/static-pages/admin/:slug', verifyAdminToken, upsertAdminStaticPage);
router.get('/static-pages/:slug', getPublicStaticPage);
router.get('/footer-settings', getPublicFooterSettingsConfig);
router.get('/footer-settings/admin', verifyAdminToken, getAdminFooterSettingsConfig);
router.put('/footer-settings/admin', verifyAdminToken, updateAdminFooterSettingsConfig);
router.get('/offers/:offerId', getPublicOfferProducts);
router.post('/offers', verifyAdminToken, createOffer);
router.put('/offers/:offerId', verifyAdminToken, updateOffer);
router.delete('/offers/:offerId', verifyAdminToken, deleteOffer);

module.exports = router;
