import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Code2,
  Globe,
  Layers,
  Layout,
  Package,
  Server,
  Settings,
  ShoppingCart,
  Smartphone,
} from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/config/categories";

const categoryIconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className="w-5 h-5" />,
  Smartphone: <Smartphone className="w-5 h-5" />,
  ShoppingCart: <ShoppingCart className="w-5 h-5" />,
  Layout: <Layout className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  Server: <Server className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
};

const categoryTagsMap: Record<string, string[]> = {
  "web-application": ["Full-Stack", "SaaS", "Dashboard"],
  "mobile-app": ["iOS", "Android", "React Native"],
  "e-commerce": ["Storefront", "Cart", "Stripe"],
  "landing-page": ["High-Converting", "Tailwind", "SEO"],
  "admin-panel": ["Analytics", "CRUD", "NextAuth"],
  "api-backend": ["REST", "Microservices", "PostgreSQL"],
  "ai-ml": ["LLM Ops", "Agents", "OpenAI"],
  other: ["Developer Tools", "Utilities", "Libraries"],
};

export function CategoriesSection() {
  return (
    <section id="categories" className="w-full bg-[#F8FAFA] py-20 px-4 sm:px-6 lg:px-8 border-y border-[#D9E2E4] scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D9E2E4] text-[#155761] text-xs font-semibold mb-3">
              <Layers className="w-3.5 h-3.5 text-[#2F7D78]" />
              <span>Curated Taxonomy</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124]">
              Explore by Ecosystem &amp; Discipline
            </h2>
            <p className="text-sm sm:text-base text-[#526267] mt-2 max-w-xl leading-relaxed">
              Structured directories vetted by engineers. Discover solutions segmented by operational utility and architectural integrity.
            </p>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#155761] hover:text-[#2F7D78] transition-colors self-start md:self-auto group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEFAULT_CATEGORIES.map((cat) => {
            const tags = categoryTagsMap[cat.slug] || ["Software", "Custom", "Verified"];
            return (
              <Link
                key={cat.slug}
                href={`/projects?category=${cat.slug}`}
                className="group p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-[#155761]/40 transition-all duration-200 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#155761] group-hover:bg-[#155761] group-hover:text-white transition-colors">
                      {categoryIconMap[cat.iconName] || <Code2 className="w-5 h-5" />}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F3F7F7] text-[#526267] text-[11px] font-medium border border-[#D9E2E4]">
                      Active
                    </span>
                  </div>
                  <h3 className="font-bold text-[#102124] text-base group-hover:text-[#155761] transition-colors mb-1.5">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#526267] line-clamp-2 leading-relaxed mb-4">
                    {cat.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#F3F7F7]">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-[#F3F7F7] text-[#526267] text-[11px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
