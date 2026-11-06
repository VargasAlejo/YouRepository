<script>

// FILA QUE SE ESTÁ EDITANDO
let filaSeleccionada = null;

// ABRIR EL MODAL CON LA INFORMACIÓN DE LA CITA SELECCIONADA
function verDetalleCita(fila){
  if(!fila || !fila.cells || fila.cells.length < 5) return;

  document.getElementById('detalleCliente').textContent = fila.cells[0].textContent.trim();
  document.getElementById('detalleServicio').textContent = fila.cells[1].textContent.trim();
  document.getElementById('detalleFecha').textContent = fila.cells[2].textContent.trim();
  document.getElementById('detalleHora').textContent = fila.cells[3].textContent.trim();
  document.getElementById('detalleEstado').textContent = fila.cells[4].textContent.trim();

  document.getElementById('modalCita').classList.add('visible');
}

function cerrarModal(){
  document.getElementById('modalCita').classList.remove('visible');
}

function cerrarModalDesdeFondo(event){
  if(event.target.id === 'modalCita') cerrarModal();
}

// AL PULSAR UNA FILA SE CONSULTAN SUS DATOS; LOS BOTONES MANTIENEN SU FUNCIÓN
document.querySelector('#listaCitas tbody').addEventListener('click',function(event){
  if(event.target.closest('button')) return;
  const fila = event.target.closest('tr');
  if(fila) verDetalleCita(fila);
});

// CERRAR EL MODAL CON LA TECLA ESC
document.addEventListener('keydown',function(event){
  if(event.key === 'Escape') cerrarModal();
});


// OBTENER LA FECHA LOCAL ACTUAL
function obtenerFechaLocal(){

  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}


// IMPEDIR SELECCIONAR FECHAS ANTERIORES A HOY
function configurarFechaMinima(){

  document.getElementById('fecha').min = obtenerFechaLocal();
}


// CAMBIAR ENTRE LAS VISTAS
function showView(id,btn){

  document.querySelectorAll('.view').forEach(v=>{
    v.classList.remove('active');
  });

  document.getElementById(id).classList.add('active');

  document.querySelectorAll('.nav button').forEach(b=>{
    b.classList.remove('active');
  });

  if(btn){
    btn.classList.add('active');
  }
}


// PREPARAR EL FORMULARIO PARA UNA CITA NUEVA
function nuevaCita(){

  cancelarEdicion();

  document.getElementById('mensaje').textContent = '';

  showView('citas',document.querySelectorAll('.nav button')[1]);
}


// CARGAR LOS DATOS DE UNA CITA PARA EDITAR
function editarCita(boton){

  filaSeleccionada = boton.closest('tr');

  const celdas = filaSeleccionada.cells;

  document.getElementById('cliente').value =
    celdas[0].textContent.trim();

  document.getElementById('servicio').value =
    celdas[1].textContent.trim();

  document.getElementById('fecha').value =
    celdas[2].textContent.trim();

  document.getElementById('hora').value =
    celdas[3].textContent.trim();

  document.getElementById('tituloFormulario').textContent =
    'Editar cita';

  document.getElementById('btnGuardar').textContent =
    'Actualizar cita';

  document.getElementById('avisoEdicion').hidden = false;
  document.getElementById('btnCancelar').hidden = false;

  document.getElementById('mensaje').textContent =
    'Modifique los datos necesarios y pulse "Actualizar cita".';

  configurarFechaMinima();

  showView('citas',document.querySelectorAll('.nav button')[1]);
}


// VERIFICAR SI OTRA CITA TIENE LA MISMA FECHA Y HORA
function existeHorarioOcupado(fecha,hora){

  const filas = document.querySelectorAll('#listaCitas tbody tr');

  return Array.from(filas).some(fila=>{

    // No comparar una cita consigo misma al editarla.
    if(fila === filaSeleccionada){
      return false;
    }

    const fechaExistente = fila.cells[2].textContent.trim();
    const horaExistente = fila.cells[3].textContent.trim();

    return fechaExistente === fecha && horaExistente === hora;
  });
}


// GUARDAR UNA CITA NUEVA O ACTUALIZAR UNA EXISTENTE
function guardar(){

  const cliente = document.getElementById('cliente').value.trim();
  const servicio = document.getElementById('servicio').value;
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;
  const msg = document.getElementById('mensaje');

  msg.classList.remove('mensaje-error');

  // VALIDAR CAMPOS OBLIGATORIOS
  if(!cliente || !fecha || !hora){

    msg.textContent =
      '⚠ Complete cliente, fecha y hora antes de continuar.';

    msg.classList.add('mensaje-error');
    return;
  }

  // VALIDAR QUE LA FECHA NO SEA ANTERIOR A HOY
  configurarFechaMinima();

  if(fecha < obtenerFechaLocal()){

    msg.textContent =
      '⚠ No puede registrar una cita en una fecha anterior al día actual.';

    msg.classList.add('mensaje-error');
    return;
  }

  // VALIDAR QUE NO EXISTA OTRA CITA EN ESE HORARIO
  if(existeHorarioOcupado(fecha,hora)){

    msg.textContent =
      '⚠ Ya existe una cita registrada para esa fecha y hora. Seleccione otro horario.';

    msg.classList.add('mensaje-error');
    return;
  }

  // SI SE ESTÁ EDITANDO, ACTUALIZAR LA FILA EXISTENTE
  if(filaSeleccionada){

    filaSeleccionada.cells[0].textContent = cliente;
    filaSeleccionada.cells[1].textContent = servicio;
    filaSeleccionada.cells[2].textContent = fecha;
    filaSeleccionada.cells[3].textContent = hora;

    cancelarEdicion();

    actualizarContadores();

    msg.textContent = '✓ Cita actualizada correctamente.';

  } else {

    // SI ES UNA CITA NUEVA, CONSTRUIR LA FILA
    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td><span class="badge">Nueva</span></td>
      <td>
        <button class="btn-editar" onclick="editarCita(this)">Editar</button>
        <button class="btn-eliminar" onclick="eliminarCita(this)">Eliminar</button>
      </td>
    `;

    // AGREGAR LOS DATOS A SUS CELDAS
    fila.cells[0].textContent = cliente;
    fila.cells[1].textContent = servicio;
    fila.cells[2].textContent = fecha;
    fila.cells[3].textContent = hora;

    document.querySelector('#listaCitas tbody').appendChild(fila);

    limpiarFormulario();
    actualizarContadores();

    msg.textContent =
      '✓ Cita registrada correctamente para ' + cliente + '.';
  }

  aplicarFiltros();

  showView('inicio',document.querySelectorAll('.nav button')[0]);
}


// CANCELAR EL MODO DE EDICIÓN
function cancelarEdicion(){

  filaSeleccionada = null;

  document.getElementById('tituloFormulario').textContent =
    'Agendar cita';

  document.getElementById('btnGuardar').textContent =
    'Guardar cita';

  document.getElementById('avisoEdicion').hidden = true;
  document.getElementById('btnCancelar').hidden = true;

  limpiarFormulario();
}


// LIMPIAR LOS CAMPOS DEL FORMULARIO
function limpiarFormulario(){

  document.getElementById('cliente').value = '';
  document.getElementById('servicio').selectedIndex = 0;
  document.getElementById('fecha').value = '';
  document.getElementById('hora').value = '';
}


// LIMPIAR CAMPOS Y MENSAJE SIN SALIR DE LA VISTA
function limpiarTodo(){
  if(filaSeleccionada){
    cancelarEdicion();
  }else{
    limpiarFormulario();
  }

  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = '';
  mensaje.classList.remove('mensaje-error');
}

// ACTUALIZAR LOS CONTADORES
function actualizarContadores(){

  const filas = document.querySelectorAll('#listaCitas tbody tr');

  document.getElementById('totalCitas').textContent = filas.length;

  const clientes = new Set(
    Array.from(filas).map(fila =>
      fila.cells[0].textContent.trim().toLowerCase()
    )
  );

  document.getElementById('totalClientes').textContent = clientes.size;
}


// BUSCAR CLIENTES Y FILTRAR POR SERVICIO
function aplicarFiltros(){

  const texto = document.getElementById('buscarCliente')
    .value.trim().toLowerCase();

  const servicioElegido =
    document.getElementById('filtroServicio').value;

  const filas = document.querySelectorAll('#listaCitas tbody tr');

  let visibles = 0;

  filas.forEach(fila=>{

    const nombreCliente = fila.cells[0].textContent.toLowerCase();
    const servicio = fila.cells[1].textContent.trim();

    const coincideCliente = nombreCliente.includes(texto);

    const coincideServicio =
      servicioElegido === 'Todos' || servicio === servicioElegido;

    const mostrar = coincideCliente && coincideServicio;

    fila.style.display = mostrar ? '' : 'none';

    if(mostrar){
      visibles++;
    }
  });

  document.getElementById('sinResultados').hidden = visibles !== 0;
}


// ELIMINAR UNA CITA
function eliminarCita(boton){

  const fila = boton.closest('tr');

  if(confirm('¿Está seguro de que desea eliminar esta cita?')){

    if(fila === filaSeleccionada){
      cancelarEdicion();
    }

    fila.remove();

    actualizarContadores();
    aplicarFiltros();
  }
}


// ACTIVAR BÚSQUEDA MIENTRAS SE ESCRIBE
document.getElementById('buscarCliente')
  .addEventListener('input',aplicarFiltros);


// ACTIVAR FILTRO CUANDO CAMBIA EL SERVICIO
document.getElementById('filtroServicio')
  .addEventListener('change',aplicarFiltros);


// INICIALIZAR LA APLICACIÓN
configurarFechaMinima();
actualizarContadores();
aplicarFiltros();

</script>