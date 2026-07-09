import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CircleCheck, CircleX, Clock } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import { paymentApi } from '../../api/paymentApi.js';
import { broadcastInvalidateQueries } from '../../api/broadcastQueryClient.js';
import { queryKeys } from '../../api/queryKeys.js';

export default function PaymentResultPage() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const status = params.get('status');
  const paymentId = params.get('paymentId');
  const paid = status === 'paid';
  const pending = status === 'pending';
  const Icon = paid ? CircleCheck : pending ? Clock : CircleX;

  useEffect(() => {
    const keys = [
      queryKeys.myPayments,
      queryKeys.myEnrollments,
      queryKeys.classes.all,
      queryKeys.admin.classes,
      queryKeys.admin.dashboard,
      queryKeys.adminPaymentHistory,
    ];

    keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    broadcastInvalidateQueries(keys);
  }, [queryClient, status, paymentId]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="grid flex-grow place-items-center px-lg py-xl">
        <section className="w-full max-w-[440px] rounded-xl border bg-white p-xl text-center shadow-lg">
          <Icon
            className={`mx-auto mb-md ${
              paid
                ? 'text-primary'
                : pending
                ? 'text-on-surface-variant'
                : 'text-error'
            }`}
            size={72}
          />
          <h1 className="mb-sm text-headline-lg font-bold">
            {paid
              ? 'Thanh toán thành công'
              : pending
              ? 'Đang xử lý thanh toán'
              : 'Thanh toán không thành công'}
          </h1>
          <p className="mb-xl text-on-surface-variant">
            {paid
              ? 'Bạn đã được ghi danh vào lớp và hóa đơn đã sẵn sàng.'
              : 'Giao dịch chưa hoàn tất. Bạn có thể kiểm tra lại trong lịch sử.'}
          </p>
          <div className="space-y-sm">
            {paid && paymentId && (
              <a
                className="block h-12 rounded-xl bg-primary py-sm font-bold text-white"
                href={paymentApi.invoiceUrl(paymentId)}
              >
                Tải hóa đơn PDF
              </a>
            )}
            <Link
              className="block h-12 rounded-xl border border-primary py-sm font-bold text-primary"
              to="/user/payments"
            >
              Xem lịch sử giao dịch
            </Link>
            <Link
              className="block py-sm text-on-surface-variant"
              to="/"
            >
              Về trang chủ
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
