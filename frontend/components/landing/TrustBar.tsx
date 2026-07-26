export default function TrustBar() {
  const metrics = [
    { value: '10,000+', label: 'MCQs' },
    { value: 'Smart', label: 'Flash Cards' },
    { value: 'High Yield', label: 'Notes' },
  ];

  return (
    <section className="py-8 md:py-10 border-y border-border relative overflow-hidden" aria-labelledby="trust-heading">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-surface to-bg-primary" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <h2 id="trust-heading" className="sr-only">Trusted by students</h2>
        <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-20">
          {metrics.map((metric, i) => (
            <div key={metric.label} className="text-center group">
              <p className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-text-primary group-hover:text-accent transition-colors duration-300">
                {metric.value}
              </p>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">{metric.label}</p>
              {i < metrics.length - 1 && (
                <div className="hidden" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
