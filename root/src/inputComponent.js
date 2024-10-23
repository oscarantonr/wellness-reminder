// Función para decrementar el valor del input
function decrement(e) {
  const btn = e.target.parentNode.parentElement.querySelector(
    'button[data-action="decrement"]'
  );
  const target = btn.nextElementSibling;
  let value = Number(target.value);
  value = Math.max(1, value - 1); // Asegura que el valor mínimo sea 1
  target.value = value;
}

// Función para incrementar el valor del input
function increment(e) {
  const btn = e.target.parentNode.parentElement.querySelector(
    'button[data-action="decrement"]'
  );
  const target = btn.nextElementSibling;
  let value = Number(target.value);
  value = Math.min(120, value + 1); // Asegura que el valor máximo sea 120
  target.value = value;
}

// Función para inicializar los eventos de los botones de incremento/decremento
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

// Exporta las funciones que quieras usar en otros archivos
export { initInputComponent };
