import React from "react";
import { ShieldCheck, Truck, RefreshCw, Feather } from "lucide-react";

const values = [
  {
    icon: Feather,
    title: "100% Organic Fibers",
    desc: "Long-staple ring-spun cotton and raw European linen.",
  },
  {
    icon: ShieldCheck,
    title: "Ethical Manufacturing",
    desc: "Fair-wage workshops and small-batch sustainable production.",
  },
  {
    icon: Truck,
    title: "Express Delivery",
    desc: "Complimentary worldwide dispatch on orders over $75.",
  },
  {
    icon: RefreshCw,
    title: "30-Day Effortless Returns",
    desc: "Prepaid return labels with quick exchange processing.",
  },
];

export default function ValuesBanner() {
  return (
    <section className="border-t border-neutral-200 bg-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-neutral-100 rounded-lg text-neutral-900 shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                    {v.title}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
