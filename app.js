'use strict';

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !motionQuery.matches) {
  document.documentElement.classList.add('js-motion');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach(item => revealObserver.observe(item));
  motionQuery.addEventListener('change', event => {
    if (event.matches) document.documentElement.classList.remove('js-motion');
  });
}

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open', expanded);
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Закрыть меню' : 'Открыть меню');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

if ('IntersectionObserver' in window) {
  const links = [...navigation.querySelectorAll('a')];
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
  links.forEach(link => sectionObserver.observe(document.querySelector(link.hash)));
}

const dialog = document.querySelector('#requestDialog');
const callbackForm = document.querySelector('#callbackForm');
const callbackTask = document.querySelector('#callbackTask');
let dialogTrigger = null;
function openRequest(task = '', trigger = document.activeElement) {
  closeMenu();
  callbackForm.reset();
  callbackForm.querySelectorAll('input, textarea').forEach(input => input.setCustomValidity(''));
  callbackTask.value = task;
  document.querySelector('#callbackResult').hidden = true;
  dialogTrigger = trigger;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  document.querySelector('#callbackName').focus();
}
document.querySelectorAll('[data-open-request]').forEach(button => {
  button.addEventListener('click', () => openRequest('', button));
});
document.querySelectorAll('[data-service]').forEach(button => {
  button.addEventListener('click', () => openRequest(button.dataset.service, button));
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  if (dialogTrigger && document.contains(dialogTrigger)) dialogTrigger.focus();
});

const jobs = [...document.querySelectorAll('input[name="job"]')];
const formatter = new Intl.NumberFormat('ru-RU');
function selectedJobs() { return jobs.filter(job => job.checked); }
function updateEstimate() {
  const selected = selectedJobs();
  const total = selected.reduce((sum, job) => sum + Number(job.value), 0);
  document.querySelector('#estimateTotal').textContent = (selected.length ? 'от ' : '') + formatter.format(total) + ' ₽';
  document.querySelector('#estimateCount').textContent = selected.length ? 'Выбрано работ: ' + selected.length : 'Пока ничего не выбрано';
  document.querySelector('#estimateButton').disabled = selected.length === 0;
}
jobs.forEach(job => job.addEventListener('change', updateEstimate));
document.querySelector('#estimateButton').addEventListener('click', event => {
  const selected = selectedJobs();
  if (!selected.length) return;
  const total = selected.reduce((sum, job) => sum + Number(job.value), 0);
  openRequest(selected.map(job => job.dataset.title).join('\n') + '\n\nПредварительный ориентир: от ' + formatter.format(total) + ' ₽, без материалов и выезда.', event.currentTarget);
});
updateEstimate();

document.querySelectorAll('.faq-list details').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) document.querySelectorAll('.faq-list details').forEach(other => {
      if (other !== item) other.open = false;
    });
  });
});

function wireDemoForm(formId, resultId) {
  const form = document.getElementById(formId);
  const result = document.getElementById(resultId);
  const phone = form.elements.phone;
  const name = form.elements.name;
  const task = form.elements.task;
  phone.addEventListener('input', () => {
    const digits = phone.value.replace(/\D/g, '');
    const valid = digits.length >= 10 && digits.length <= 15 && /^[\d\s()+\-]+$/.test(phone.value);
    phone.setCustomValidity(phone.value && !valid ? 'Укажите телефон: от 10 до 15 цифр.' : '');
  });
  [name, task].forEach(input => input.addEventListener('input', () => {
    input.setCustomValidity(input.value && !input.value.trim() ? 'Заполните это поле.' : '');
  }));
  form.addEventListener('input', () => { result.hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity(digits.length < 10 || digits.length > 15 || !/^[\d\s()+\-]+$/.test(phone.value) ? 'Укажите телефон: от 10 до 15 цифр.' : '');
    name.setCustomValidity(name.value.trim() ? '' : 'Укажите имя.');
    task.setCustomValidity(task.value.trim() ? '' : 'Опишите задачу.');
    if (!form.reportValidity()) return;
    result.textContent = 'Всё заполнено правильно! В рабочей версии заявка была бы передана мастеру. Это демо: данные не отправлялись и не сохранялись.';
    result.hidden = false;
    form.reset();
  });
}
wireDemoForm('leadForm', 'leadResult');
wireDemoForm('callbackForm', 'callbackResult');
