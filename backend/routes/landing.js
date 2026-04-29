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
router.get('/offers/:offerId', getPublicOfferProducts);
router.post('/offers', verifyAdminToken, createOffer);
router.put('/offers/:offerId', verifyAdminToken, updateOffer);
router.delete('/offers/:offerId', verifyAdminToken, deleteOffer);

module.exports = router;
