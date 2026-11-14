'use strict';
const form = document.querySelector('#unlock-form');
const field = document.querySelector('#password');
const feedback = document.querySelector('#feedback');
const submit = document.querySelector('#submit');
const submitText = document.querySelector('#submit-text');
const visibility = document.querySelector('#visibility');
let pending = false;
visibility.addEventListener('click', () => {
  const reveal = field.type === 'password';
  field.type = reveal ? 'text' : 'password';
  visibility.textContent = reveal ? 'СКРЫТЬ' : 'ПОКАЗАТЬ';
  visibility.setAttribute('aria-label', reveal ? 'Скрыть код' : 'Показать код');
  visibility.setAttribute('aria-pressed', String(reveal));
});
field.addEventListener('input', () => { field.removeAttribute('aria-invalid'); feedback.textContent = ''; });
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending) return;
  if (!field.value.trim()) { feedback.textContent = 'Введите код доступа.'; field.focus(); return; }
  pending = true;
  submit.disabled = true;
  field.readOnly = true;
  form.setAttribute('aria-busy', 'true');
  feedback.textContent = '';
  submitText.textContent = 'ПРОВЕРКА СИГНАЛА…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/api/unlock', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: field.value }), signal: controller.signal, cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401) field.setAttribute('aria-invalid', 'true');
      feedback.textContent = result.error || 'Передача прервана. Повторите попытку.';
      return;
    }
    document.querySelector('#success-label').textContent = result.label;
    document.querySelector('#success-title').textContent = result.title;
    const transmission = document.querySelector('#transmission');
    transmission.replaceChildren(...result.paragraphs.map(text => {
      const paragraph = document.createElement('p'); paragraph.textContent = text; return paragraph;
    }));
    document.querySelector('#complete').textContent = result.footer;
    document.querySelector('#signature').textContent = result.signature;
    document.querySelector('#access').hidden = true;
    document.querySelector('#success').hidden = false;
    document.querySelector('#footer-state').textContent = 'СЮРПРИЗ ДОСТАВЛЕН';
    document.querySelector('#art-number').textContent = '15.11';
    document.querySelector('#art-label').textContent = 'ENCOUNTER / SPECIAL MISSION';
    document.querySelector('#art-bottom').textContent = 'СЕГОДНЯ ИГРАЕМ ДЛЯ ТЕБЯ.';
    document.body.classList.add('unlocked');
    field.value = '';
    document.querySelector('#success-title').focus();
    startCelebration();
  } catch {
    feedback.textContent = 'Связь с архивом прервана. Проверьте интернет и повторите попытку.';
  } finally {
    clearTimeout(timeout);
    pending = false; submit.disabled = false; field.readOnly = false;
    form.removeAttribute('aria-busy'); submitText.textContent = 'ВОССТАНОВИТЬ ПЕРЕДАЧУ';
  }
});
document.querySelector('#reset').addEventListener('click', () => {
  stopCelebration();
  document.querySelector('#access').hidden = false;
  document.querySelector('#success').hidden = true;
  document.querySelector('#transmission').replaceChildren();
  document.querySelector('#signature').textContent = '';
  document.querySelector('#success-title').textContent = '';
  document.querySelector('#success-label').textContent = '';
  document.querySelector('#complete').textContent = '';
  document.querySelector('#art-number').textContent = '74';
  document.querySelector('#art-label').textContent = 'PANEM / SIGNAL ARCHIVE';
  document.querySelector('#art-bottom').textContent = 'THE FINAL DECISION IS NOT ON RECORD.';
  document.body.classList.remove('unlocked');
  document.querySelector('#footer-state').textContent = 'СОЕДИНЕНИЕ ЗАЩИЩЕНО';
  field.type = 'password'; visibility.textContent = 'ПОКАЗАТЬ';
  visibility.setAttribute('aria-pressed', 'false'); visibility.setAttribute('aria-label', 'Показать код');
  feedback.textContent = ''; field.focus();
});

// Local effects: no sound, external services, or persistent animation loop.
const canvas = document.querySelector('#celebration');
const context = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const colors = ['#edca81', '#b6d590', '#e8dfbc', '#d99471', '#b7d6cd'];
let animation = 0;
let particles = [];
let viewWidth = 0;
let viewHeight = 0;
function resizeCanvas() {
  viewWidth = window.innerWidth;
  viewHeight = window.innerHeight;
  const scale = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(viewWidth * scale);
  canvas.height = Math.round(viewHeight * scale);
  canvas.style.width = viewWidth + 'px';
  canvas.style.height = viewHeight + 'px';
  context.setTransform(scale, 0, 0, scale, 0, 0);
}
function stopCelebration() {
  if (animation) cancelAnimationFrame(animation);
  animation = 0;
  particles = [];
  if (context) context.clearRect(0, 0, viewWidth, viewHeight);
  canvas.hidden = true;
}
function addBurst(x, y) {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const count = viewWidth < 600 ? 30 : 48;
  for (let i = 0; i < count; i++) {
    const angle = Math.PI * 2 * i / count;
    const speed = 50 + Math.random() * 100;
    particles.push({x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      age: 0, life: 1.2 + Math.random() * 1.1, color, kind: 'spark', rotation: 0});
  }
}
function startCelebration() {
  stopCelebration();
  if (!context || reducedMotion.matches || document.hidden) return;
  resizeCanvas();
  canvas.hidden = false;
  const count = viewWidth < 600 ? 48 : 85;
  for (let i = 0; i < count; i++) {
    particles.push({x: Math.random() * viewWidth, y: -Math.random() * viewHeight,
      vx: (Math.random() - 0.5) * 55, vy: 65 + Math.random() * 90,
      age: 0, life: 7 + Math.random() * 2, color: colors[i % colors.length],
      kind: 'confetti', rotation: Math.random() * Math.PI * 2});
  }
  let elapsed = 0;
  let previous = 0;
  let nextBurst = 0;
  function frame(time) {
    if (document.hidden || reducedMotion.matches) {stopCelebration();return;}
    const delta = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
    previous = time;
    elapsed += delta;
    context.clearRect(0, 0, viewWidth, viewHeight);
    if (elapsed >= nextBurst && elapsed < 5.5) {
      addBurst(viewWidth * (0.1 + Math.random() * 0.8), viewHeight * (0.1 + Math.random() * 0.4));
      nextBurst = elapsed + 0.9;
    }
    for (const p of particles) {
      p.age += delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      if (p.kind === 'spark') p.vy += 42 * delta;
      else p.rotation += delta * 1.7;
      context.globalAlpha = Math.max(0, Math.min(1, (p.life - p.age) / (p.kind === 'spark' ? p.life : 1.5)));
      context.fillStyle = p.color;
      if (p.kind === 'spark') {
        context.beginPath();context.arc(p.x, p.y, 1.7, 0, Math.PI * 2);context.fill();
      } else {
        context.save();context.translate(p.x, p.y);context.rotate(p.rotation);
        context.fillRect(-2, -4, 4, 8);context.restore();
      }
    }
    context.globalAlpha = 1;
    particles = particles.filter(p => p.age < p.life && p.y < viewHeight + 30);
    if (elapsed >= 9 || particles.length === 0) {stopCelebration();return;}
    animation = requestAnimationFrame(frame);
  }
  animation = requestAnimationFrame(frame);
}
document.querySelector('#replay').addEventListener('click', startCelebration);
window.addEventListener('resize', () => {if (!canvas.hidden && context) resizeCanvas();});
document.addEventListener('visibilitychange', () => {if (document.hidden) stopCelebration();});
reducedMotion.addEventListener('change', event => {if (event.matches) stopCelebration();});
