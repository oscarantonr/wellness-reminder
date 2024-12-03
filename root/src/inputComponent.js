function decrement(e) {
  const btn = e.target.parentNode.parentElement.querySelector(
    'button[data-action="decrement"]'
  );
  const target = btn.nextElementSibling;
  let value = Number(target.value);
  value = Math.max(1, value - 1);
  target.value = value;
}

function increment(e) {
  const btn = e.target.parentNode.parentElement.querySelector(
    'button[data-action="decrement"]'
  );
  const target = btn.nextElementSibling;
  let value = Number(target.value);
  value = Math.min(120, value + 1);
  target.value = value;
}

function initInputComponent() {
  const decrementButtons = document.querySelectorAll('button[data-action="decrement"]');
  const incrementButtons = document.querySelectorAll('button[data-action="increment"]');

  decrementButtons.forEach(btn => {
      btn.addEventListener("click", decrement);
  });

  incrementButtons.forEach(btn => {
      btn.addEventListener("click", increment);
  });
}

export { initInputComponent };
