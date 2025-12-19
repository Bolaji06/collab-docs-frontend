
import { DashboardLayout } from "./DashboardLayout";
import { User, Mail, Shield, Smartphone } from "lucide-react";
import { useUserStore } from "../../store/useUserStore";

export default function SettingsPage() {
    const { user } = useUserStore();

    interface SettingsItem {
        label: string;
        value: string;
        icon: any;
        action?: string;
    }

    // Placeholder data since we don't have full settings API yet
    const sections: { title: string; icon: any; items: SettingsItem[] }[] = [
        {
            title: "Account",
            icon: User,
            items: [
                { label: "Username", value: user?.username || "Not set", icon: User },
                { label: "Email", value: user?.email || "Not set", icon: Mail },
            ]
        },
        {
            title: "Security",
            icon: Shield,
            items: [
                { label: "Password", value: "••••••••", icon: Shield, action: "Change" },
                { label: "2FA", value: "Disabled", icon: Smartphone, action: "Enable" },
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Settings
                </h1>
                <p className="text-gray-500 dark:text-zinc-400">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-8 max-w-4xl">
                {sections.map((section) => (
                    <div key={section.title} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 flex items-center gap-2">
                            <section.icon className="w-5 h-5 text-indigo-500" />
                            <h2 className="font-semibold text-gray-900 dark:text-white">
                                {section.title}
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                            {section.items.map((item) => (
                                <div key={item.label} className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                                                {item.label}
                                            </p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {item.value}
                                            </p>
                                        </div>
                                    </div>
                                    {item.action && (
                                        <button className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                                            {item.action}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}
