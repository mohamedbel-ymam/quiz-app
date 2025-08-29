import { useTranslation } from 'react-i18next';
export default function T({ children }) {
  const { t } = useTranslation();
  return t(children);
}