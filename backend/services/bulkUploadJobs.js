/** In-memory bulk upload job tracker (single-server). */

const JOB_TTL_MS = 60 * 60 * 1000;
const jobs = new Map();

function createBulkUploadJob(totalProducts) {
  const jobId = `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const job = {
    id: jobId,
    status: 'running',
    totalProducts,
    processed: 0,
    currentProduct: null,
    successCount: 0,
    failureCount: 0,
    results: [],
    startedAt: Date.now(),
    completedAt: null,
    error: null,
  };
  jobs.set(jobId, job);

  setTimeout(() => jobs.delete(jobId), JOB_TTL_MS).unref?.();

  return jobId;
}

function getBulkUploadJob(jobId) {
  return jobs.get(jobId) || null;
}

function patchBulkUploadJob(jobId, patch) {
  const job = jobs.get(jobId);
  if (!job) return null;
  Object.assign(job, patch);
  return job;
}

function completeBulkUploadJob(jobId, result) {
  return patchBulkUploadJob(jobId, {
    status: 'completed',
    processed: result.totalProducts,
    successCount: result.successCount,
    failureCount: result.failureCount,
    results: result.results,
    currentProduct: null,
    completedAt: Date.now(),
  });
}

function failBulkUploadJob(jobId, error) {
  return patchBulkUploadJob(jobId, {
    status: 'failed',
    error: error || 'Bulk upload failed',
    currentProduct: null,
    completedAt: Date.now(),
  });
}

module.exports = {
  createBulkUploadJob,
  getBulkUploadJob,
  patchBulkUploadJob,
  completeBulkUploadJob,
  failBulkUploadJob,
};
