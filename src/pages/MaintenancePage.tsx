import commandLogo from '@/assets/command-logo.png';
import loginBg from '@/assets/login-bg.jpg';

export function MaintenancePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="text-center space-y-8">
        <img
          src={commandLogo}
          alt="Command OS"
          className="h-16 w-auto mx-auto brightness-0 invert"
        />

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Em manutenção
          </h1>
          <p className="text-white/70 text-lg max-w-md mx-auto leading-relaxed">
            Estamos preparando novidades para você.<br />
            Mais informações em breve.
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse [animation-delay:0.3s]" />
          <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse [animation-delay:0.6s]" />
        </div>
      </div>
    </div>
  );
}
