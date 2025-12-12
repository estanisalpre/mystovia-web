import { useEffect, type ReactNode } from 'react';
import '../i18n';

interface Props {
  children?: ReactNode;
}

export default function I18nProvider({ children }: Props) {
  useEffect(() => {
  }, []);

  return <>{children}</>;
}
