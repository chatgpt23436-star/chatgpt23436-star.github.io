document.addEventListener('DOMContentLoaded', function() {

  // --- ELEMENTOS DEL DOM ---
  const mainApp = document.getElementById('main-app');
  // Modales
  const loginModal = document.getElementById('login-modal');
  const videoModal = document.getElementById('video-modal');
  const welcomeMessageModal = document.getElementById('welcome-message-modal');
  // Botones y Controles
  const loginButton = document.getElementById('login-button');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const welcomeVideo = document.getElementById('welcome-video');
  const closeVideoButton = document.getElementById('close-video-button');
  const closeWelcomeButton = document.getElementById('close-welcome-button');
  
  // --- LÓGICA DE LA SECUENCIA DE BIENVENIDA ---
  loginButton.addEventListener('click', function() {
    if (usernameInput.value.trim() !== '' && passwordInput.value.trim() !== '') {
      loginModal.style.display = 'none';
      videoModal.style.display = 'flex';
      welcomeVideo.play();
    } else {
      alert('Por favor, ingresa un usuario y contraseña.');
    }
  });

  closeVideoButton.addEventListener('click', function() {
    videoModal.style.display = 'none';
    welcomeVideo.pause();
    mainApp.style.display = 'block';
    
    // AÑADIMOS UNA CLASE AL BODY PARA ACTIVAR EL FONDO ANIMADO
    document.body.classList.add('app-visible');
    
    initializeApp();
    
    setTimeout(() => {
      welcomeMessageModal.style.display = 'flex';
    }, 1500);
  });
  
  closeWelcomeButton.addEventListener('click', function() {
      welcomeMessageModal.style.display = 'none';
  });

  // Muestra el modal de login al cargar la página
  loginModal.style.display = 'flex';
});

// --- FUNCIÓN QUE INICIALIZA TODA LA APP ---
function initializeApp() {
  let map = L.map('map').setView([19.4326, -99.1332], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  var swiper = new Swiper('.swiper-container', {
    slidesPerView: 1, spaceBetween: 30, loop: true,
    pagination: { el: '.swiper-pagination', clickable: true, },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev', },
    breakpoints: { 768: { slidesPerView: 2, spaceBetween: 20 } }
  });
  let controlRuta;
  let coordsOrigen, coordsDestino;
  let costoTotal = 0;
  window.buscarDireccion = function(inputId, sugerenciasId, callback){
    let input = document.getElementById(inputId);
    let lista = document.getElementById(sugerenciasId);
    input.addEventListener('input', function(){
      let query = input.value;
      if(query.length < 3){ lista.innerHTML = ''; return;}
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
        .then(res => res.json())
        .then(data => {
          lista.innerHTML = '';
          data.forEach(item => {
            let li = document.createElement('li');
            li.textContent = item.display_name;
            li.addEventListener('click', function(){
              input.value = item.display_name;
              lista.innerHTML = '';
              callback([parseFloat(item.lat), parseFloat(item.lon)]);
            });
            lista.appendChild(li);
          });
        });
    });
  }
  buscarDireccion('origen','sugerenciasOrigen', coords => coordsOrigen = coords);
  buscarDireccion('destino','sugerenciasDestino', coords => coordsDestino = coords);
  window.calcularRuta = function(){
    if(!coordsOrigen || !coordsDestino){ alert("Selecciona origen y destino"); return;}
    let tamano = document.getElementById("tamano").value;
    if(controlRuta) map.removeControl(controlRuta);
    controlRuta = L.Routing.control({
      waypoints: [L.latLng(coordsOrigen), L.latLng(coordsDestino)],
      language: 'es'
    }).on('routesfound', function(e){
      let distanciaKm = e.routes[0].summary.totalDistance / 1000;
      let costoKm = distanciaKm * 10;
      let extra = (tamano==='chico')?50:(tamano==='mediano')?100:150;
      costoTotal = costoKm + extra;
      document.getElementById("resultado").innerHTML =
        `<h3>Resultado del viaje</h3><p>Distancia: ${distanciaKm.toFixed(2)} km</p><p>Costo por distancia: $${costoKm.toFixed(2)}</p><p>Costo adicional: $${extra}</p><h4>Total a pagar: $${costoTotal.toFixed(2)}</h4>`;
    }).addTo(map);
  }
  window.guardarViaje = function(){
    if(costoTotal === 0){ alert("Primero calcula la ruta"); return;}
    let metodo_pago = document.getElementById("metodo_pago").value;
    let viaje = {
      nombre: document.getElementById("nombre").value, telefono: document.getElementById("telefono").value, correo: document.getElementById("correo").value, nombre_perro: document.getElementById("nombre_perro").value, tamano: document.getElementById("tamano").value, temperamento: document.getElementById("temperamento").value, origen: document.getElementById("origen").value, destino: document.getElementById("destino").value, costo: costoTotal.toFixed(2), metodo_pago: metodo_pago, fecha: new Date().toLocaleString()
    };
    let viajes = JSON.parse(localStorage.getItem("viajes")) || [];
    viajes.push(viaje);
    localStorage.setItem("viajes", JSON.stringify(viajes));
    mostrarViajes();
    if(metodo_pago === "paypal"){
      mostrarBotonPayPal();
    } else {
      alert("Pago en efectivo confirmado ✅");
    }
  }
  function mostrarViajes(){
    let viajes = JSON.parse(localStorage.getItem("viajes")) || [];
    let tbody = document.querySelector("#tablaViajes tbody");
    tbody.innerHTML = "";
    viajes.forEach(v => {
      let fila = `<tr><td>${v.nombre}</td><td>${v.telefono}</td><td>${v.nombre_perro}</td><td>${v.tamano}</td><td>${v.origen}</td><td>${v.destino}</td><td>$${v.costo}</td><td>${v.metodo_pago}</td></tr>`;
      tbody.innerHTML += fila;
    });
  }
  function mostrarBotonPayPal(){
    document.getElementById("paypal-button-container").innerHTML = "";
    paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({ purchase_units: [{ amount: { value: costoTotal.toFixed(2) } }] });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          alert("Pago completado por " + details.payer.name.given_name);
        });
      }
    }).render('#paypal-button-container');
  }
  
  mostrarViajes();
}