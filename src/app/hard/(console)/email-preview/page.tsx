import type { Metadata } from "next";
import {
  emailTemplateCatalog,
  renderEmailTemplate,
} from "@/lib/email/templates/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email templates",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function EmailPreviewPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Email templates
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-white/55">
          Internal preview only. These messages are not indexed and are not
          linked from the public site. Production sends HTML + plain text via
          Resend from {`helpdesk@northiumcu.com`}.
        </p>
      </div>

      <div className="space-y-12">
        {emailTemplateCatalog.map((template) => {
          const message = renderEmailTemplate(template.id, template.sampleData);
          return (
            <section
              key={template.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f2233] shadow-none"
            >
              <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-northium-gold">
                      {template.id}
                    </p>
                    <h2 className="mt-1 font-heading text-lg font-semibold text-white">
                      {template.name}
                    </h2>
                    <p className="mt-1 text-sm text-white/55">
                      {template.description}
                    </p>
                  </div>
                  <div className="text-right text-xs text-white/50">
                    <p>
                      <span className="font-semibold text-white/80">
                        Trigger:
                      </span>{" "}
                      {template.trigger}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-white/80">
                        Subject:
                      </span>{" "}
                      {message.subject}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-2">
                <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
                  <div className="border-b border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white/45">
                    HTML preview
                  </div>
                  <iframe
                    title={`${template.name} HTML`}
                    srcDoc={message.html}
                    className="h-[640px] w-full bg-white"
                    sandbox=""
                  />
                </div>
                <div>
                  <div className="border-b border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white/45">
                    Plain text fallback
                  </div>
                  <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-relaxed text-white/70">
                    {message.text}
                  </pre>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
