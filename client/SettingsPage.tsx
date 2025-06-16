import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Простая страница настроек с обновлением аватара
export default function SettingsPage({ user }: { username: string; email: string }) {
  const { t } = useTranslation();
  const [form] = useState({ username: user.username, email: user.email });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await axios.post("/api/user/avatar", data);
    alert(t("profile.profileSaved"));
    location.reload();
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <input name="username" defaultValue={form.username} />
      <input name="email" defaultValue={form.email} type="email" />
      <input name="avatar" type="file" accept="image/*" />
      <button>{t('common.save')}</button>
    </form>
  );
}
