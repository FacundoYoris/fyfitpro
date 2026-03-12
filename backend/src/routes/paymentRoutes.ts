import { Router } from 'express';
import { 
  getPayments, 
  getPaymentById, 
  createPayment, 
  getUserPaymentStatus,
  markMonthAsPaid,
  markMonthAsUnpaid,
  getUserPayments,
  deletePayment
} from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, roleMiddleware('admin'), getPayments);
router.post('/', authMiddleware, roleMiddleware('admin'), createPayment);
router.get('/user/:userId/status', authMiddleware, getUserPaymentStatus);
router.post('/mark-paid', authMiddleware, roleMiddleware('admin'), markMonthAsPaid);
router.post('/mark-unpaid', authMiddleware, roleMiddleware('admin'), markMonthAsUnpaid);
router.get('/user/:userId', authMiddleware, roleMiddleware('admin'), getUserPayments);
router.get('/:id', authMiddleware, roleMiddleware('admin'), getPaymentById);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deletePayment);

export default router;
