import { Suspense } from 'react';
import { ComplianceSession } from '@/views/components/compliance/ComplianceSession';

export default function ComplianceCheckPage() {
  return (
    <Suspense fallback={null}>
      <ComplianceSession />
    </Suspense>
  );
}
