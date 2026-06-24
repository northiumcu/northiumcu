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
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Email templates
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-northium-muted">
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
              className="overflow-hidden rounded-2xl border border-northium-border bg-white shadow-sm"
            >
              <div className="border-b border-northium-border bg-northium-surface px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-northium-gold">
                      {template.id}
                    </p>
                    <h2 className="mt-1 font-heading text-lg font-semibold text-northium-primary">
                      {template.name}
                    </h2>
                    <p className="mt-1 text-sm text-northium-muted">
                      {template.description}
                    </p>
                  </div>
                  <div className="text-right text-xs text-northium-muted">
                    <p>
                      <span className="font-semibold text-northium-primary">
                        Trigger:
                      </span>{" "}
                      {template.trigger}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-northium-primary">
                        Subject:
                      </span>{" "}
                      {message.subject}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-2">
                <div className="border-b border-northium-border lg:border-b-0 lg:border-r">
                  <div className="border-b border-northium-border px-5 py-2 text-xs font-semibold uppercase tracking-wider text-northium-muted">
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
                  <div className="border-b border-northium-border px-5 py-2 text-xs font-semibold uppercase tracking-wider text-northium-muted">
                    Plain text fallback
                  </div>
                  <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-relaxed text-northium-text">
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
