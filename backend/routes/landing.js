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

module.exports = router;
