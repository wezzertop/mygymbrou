export type QuoteCategory =
  | "disciplina"
  | "constancia"
  | "fuerza_mental"
  | "superacion"
  | "nutricion"
  | "recuperacion"
  | "enfoque";

export type QuoteAudience = "student" | "coach" | "both";

export interface MotivationalQuote {
  id: string;
  text: string;
  category: QuoteCategory;
  audience: QuoteAudience;
}

export const QUOTE_CATEGORY_LABELS: Record<QuoteCategory, string> = {
  disciplina: "Disciplina",
  constancia: "Constancia",
  fuerza_mental: "Fuerza Mental",
  superacion: "Superación",
  nutricion: "Nutrición",
  recuperacion: "Recuperación",
  enfoque: "Enfoque",
};

const RAW_QUOTES: [QuoteCategory, QuoteAudience, string][] = [
  // ================= DISCIPLINA (30) =================
  ["disciplina", "both", "La disciplina empieza exactamente donde terminan las ganas."],
  ["disciplina", "student", "No negocias contigo mismo: cumples la sesión que prometiste."],
  ["disciplina", "both", "El cuerpo obedece a la mente que decide no rendirse."],
  ["disciplina", "student", "Cada serie bien ejecutada es un voto a favor de quien quieres ser."],
  ["disciplina", "coach", "Tu ejemplo diario enseña más que mil indicaciones."],
  ["disciplina", "both", "Hacer lo necesario incluso en días grises construye resultados sólidos."],
  ["disciplina", "student", "La motivación te lleva al gimnasio; la disciplina te hace terminar el plan."],
  ["disciplina", "both", "Pequeños estándares cumplidos hoy crean grandes cambios mañana."],
  ["disciplina", "coach", "La excelencia en tu método empieza por tu propia puntualidad y orden."],
  ["disciplina", "student", "Respeta tu horario de entreno como respetas una cita importante."],
  ["disciplina", "both", "Sin atajos: técnica limpia, esfuerzo honesto y paciencia."],
  ["disciplina", "student", "Cuando el plan está claro, la excusa pierde fuerza."],
  ["disciplina", "both", "La libertad física se gana con estructura diaria."],
  ["disciplina", "coach", "Un coach disciplinado multiplica la confianza de toda su comunidad."],
  ["disciplina", "student", "Completa la última repetición con la misma calidad que la primera."],
  ["disciplina", "both", "No esperes el momento perfecto; crea el hábito en el momento actual."],
  ["disciplina", "student", "Hoy entrenas por el resultado que agradecerás en seis meses."],
  ["disciplina", "both", "Lo que haces sin que nadie mire define tu verdadero nivel."],
  ["disciplina", "coach", "Liderar es sostener el estándar cuando otros quieren bajarlo."],
  ["disciplina", "student", "Tu compromiso pesa más que cualquier barra en el rack."],
  ["disciplina", "both", "Orden en tu rutina, claridad en tus resultados."],
  ["disciplina", "student", "Cada entrenamiento cumplido fortalece tu carácter antes que tus músculos."],
  ["disciplina", "both", "La disciplina no te limita; te acerca a tu mejor versión."],
  ["disciplina", "coach", "Cada seguimiento a tiempo transforma un intento en un hábito real."],
  ["disciplina", "student", "Presentarte ya es la mitad de la victoria; ejecutar bien es la otra mitad."],
  ["disciplina", "both", "Menos improvisación, más ejecución consciente."],
  ["disciplina", "student", "El progreso respeta a quien respeta su proceso."],
  ["disciplina", "both", "Construye hábitos tan firmes que el cansancio no los derribe."],
  ["disciplina", "coach", "Tu consistencia profesional es el ancla de tus atletas."],
  ["disciplina", "both", "Haz de la palabra cumplida tu mejor entrenamiento."],

  // ================= CONSTANCIA (30) =================
  ["constancia", "both", "Constancia diaria hacia tu meta: un día a la vez, sin romper la cadena."],
  ["constancia", "student", "No necesitas una semana perfecta; necesitas no abandonar después de un mal día."],
  ["constancia", "both", "Lo ordinario hecho con constancia produce resultados extraordinarios."],
  ["constancia", "student", "Un entrenamiento moderado hoy vale diez veces más que uno perfecto que nunca hiciste."],
  ["constancia", "coach", "Acompañar semana a semana es el verdadero secreto de la transformación."],
  ["constancia", "both", "El cambio real se nota en meses, pero se fabrica en minutos diarios."],
  ["constancia", "student", "Suma sesiones, suma comidas bien hechas, suma horas de sueño."],
  ["constancia", "both", "La constancia vence al talento cuando el talento se detiene."],
  ["constancia", "student", "Tu cuerpo recuerda la repetición constante, no el esfuerzo aislado."],
  ["constancia", "coach", "Cada evaluación registrada cuenta una historia de esfuerzo continuo."],
  ["constancia", "both", "Paso firme hoy, avance medible al final del mes."],
  ["constancia", "student", "Vuelve mañana, aunque hoy solo hayas dado el ochenta por ciento."],
  ["constancia", "both", "La suma de tus decisiones pequeñas es tu transformación completa."],
  ["constancia", "student", "No midas tu valor por un solo día; mídelo por tu tendencia mensual."],
  ["constancia", "coach", "Mantener presente a tu comunidad cada semana cambia vidas."],
  ["constancia", "both", "El secreto menos glamoroso del fitness es simplemente no dejar de aparecer."],
  ["constancia", "student", "Cada semana completa en el calendario es una prueba de tu compromiso."],
  ["constancia", "both", "Sigue construyendo incluso cuando el espejo aún no muestra todo el trabajo."],
  ["constancia", "student", "Un bloque más, una semana más, una versión más fuerte de ti."],
  ["constancia", "coach", "Los grandes resultados de tus alumnos nacen de ajustes constantes."],
  ["constancia", "both", "La paciencia activa es trabajar diario sin desesperarte."],
  ["constancia", "student", "Tu racha no se trata de perfección, se trata de volver siempre."],
  ["constancia", "both", "Ritmo sostenible supera a la intensidad pasajera."],
  ["constancia", "student", "Hoy siembras con cada repetición lo que cosecharás la próxima temporada."],
  ["constancia", "coach", "Cada mensaje de seguimiento mantiene encendida la chispa de tus alumnos."],
  ["constancia", "both", "La constancia silenciosa siempre termina haciendo ruido en los resultados."],
  ["constancia", "student", "Hazlo parte de tu semana como respirar."],
  ["constancia", "both", "Cien pasos firmes llegan más lejos que un salto impulsivo."],
  ["constancia", "student", "Confía en el acumulado: cada gota llena el vaso."],
  ["constancia", "both", "Quien persiste con método, inevitablemente progresa."],

  // ================= FUERZA MENTAL (30) =================
  ["fuerza_mental", "both", "La mente se rinde mucho antes que el músculo; respira y sigue."],
  ["fuerza_mental", "student", "Incomodidad temporal, orgullo permanente."],
  ["fuerza_mental", "both", "Entrenar en días difíciles blinda tu carácter para todo lo demás."],
  ["fuerza_mental", "student", "No temas a la carga pesada; respétala, prepárate y domínala."],
  ["fuerza_mental", "coach", "Tu calma bajo presión guía a tus alumnos a creer en sí mismos."],
  ["fuerza_mental", "both", "Cuando dudes de ti, recuerda cuántas veces ya cumpliste."],
  ["fuerza_mental", "student", "Controla tu respiración y controlarás la serie."],
  ["fuerza_mental", "both", "La fortaleza real se nota en cómo respondes cuando algo no sale fácil."],
  ["fuerza_mental", "student", "Cada reto superado en el rack te prepara para los retos fuera del gimnasio."],
  ["fuerza_mental", "both", "Cambia el 'no puedo' por 'todavía lo estoy construyendo'."],
  ["fuerza_mental", "coach", "Enseñas a levantar peso, pero sobre todo a levantar la confianza."],
  ["fuerza_mental", "student", "Tu diálogo interno es tu compañero de entrenamiento más importante."],
  ["fuerza_mental", "both", "La serenidad también es una forma de potencia."],
  ["fuerza_mental", "student", "Acepta el esfuerzo sin dramatizarlo: enfócate y ejecuta."],
  ["fuerza_mental", "both", "Las excusas son cómodas hoy y caras mañana."],
  ["fuerza_mental", "student", "Si tiemblan las piernas, significa que estás creciendo."],
  ["fuerza_mental", "coach", "Un buen entrenador ve potencial incluso cuando el alumno solo ve cansancio."],
  ["fuerza_mental", "both", "No busques que sea más fácil; vuélvete más capaz."],
  ["fuerza_mental", "student", "Mantén la calma en el descanso y la determinación en el levantamiento."],
  ["fuerza_mental", "both", "Tu resistencia mental crece cada vez que eliges seguir una serie más."],
  ["fuerza_mental", "student", "Eres más fuerte que el impulso de posponerlo para el lunes."],
  ["fuerza_mental", "both", "La confianza no llega antes de actuar; llega después de cumplir."],
  ["fuerza_mental", "coach", "Sostener la visión de tus alumnos cuando flaquean es tu mayor superpoder."],
  ["fuerza_mental", "student", "Enfrenta la serie más dura con postura firme y mente despejada."],
  ["fuerza_mental", "both", "Nada fortalece más la autoestima que demostrarle hechos a tu propia mente."],
  ["fuerza_mental", "student", "Hoy no buscas aplausos; buscas superarte en silencio."],
  ["fuerza_mental", "both", "La presión bien canalizada se convierte en precisión."],
  ["fuerza_mental", "student", "Cada obstáculo es solo una nueva resistencia que vencer."],
  ["fuerza_mental", "both", "Mantén el temple: el progreso premia a las mentes pacientes."],
  ["fuerza_mental", "both", "Decide ser imparable en lo que sí depende de ti."],

  // ================= SUPERACIÓN (30) =================
  ["superacion", "both", "Compite únicamente contra tu versión de la semana pasada."],
  ["superacion", "student", "Un kilo más, una repetición más o mejor técnica: todo cuenta como avance."],
  ["superacion", "both", "Lo que hoy parece tu techo, en unos meses será tu calentamiento."],
  ["superacion", "student", "Celebra cada centímetro ganado y cada hábito consolidado."],
  ["superacion", "coach", "Cada alumno que supera su límite valida el valor de tu preparación."],
  ["superacion", "both", "Superarte no es ser perfecto; es mejorar un uno por ciento con intención."],
  ["superacion", "student", "Mira tus gráficas de hace tres meses y reconoce cuánto avanzaste."],
  ["superacion", "both", "Salir de la zona cómoda con técnica es el camino más seguro al progreso."],
  ["superacion", "student", "Hoy puedes levantar algo que hace un año creías imposible."],
  ["superacion", "coach", "Evoluciona tu metodología cada temporada; un gran coach nunca deja de aprender."],
  ["superacion", "both", "Los récords personales empiezan con respeto por los fundamentos."],
  ["superacion", "student", "Cada nueva marca nace de haber dominado primero el peso anterior."],
  ["superacion", "both", "No subestimes lo que puede cambiar tu cuerpo en doce semanas bien guiadas."],
  ["superacion", "student", "Agradece de dónde vienes y trabaja por hacia dónde vas."],
  ["superacion", "coach", "Tu crecimiento profesional eleva el techo de toda tu cartera."],
  ["superacion", "both", "La verdadera evolución se mide con datos, no con comparaciones ajenas."],
  ["superacion", "student", "Transforma cada error de técnica en aprendizaje inmediato."],
  ["superacion", "both", "Siempre hay un siguiente nivel esperándote cuando estás listo para trabajarlo."],
  ["superacion", "student", "Haz que tu yo del futuro se sienta orgulloso de la sesión de hoy."],
  ["superacion", "coach", "Construye un estudio y una marca que reflejen tu mejor estándar."],
  ["superacion", "both", "El progreso es tuyo cuando te haces responsable de cada detalle."],
  ["superacion", "student", "No te conformes con entrenar en piloto automático; busca calidad en cada rep."],
  ["superacion", "both", "Cada etapa nueva exige una versión más enfocada de ti."],
  ["superacion", "student", "Si hoy lograste terminar lo que ayer dejabas a medias, ya ganaste."],
  ["superacion", "coach", "Ayudar a alguien a descubrir de lo que es capaz no tiene precio."],
  ["superacion", "both", "Rompe tus propios mitos a base de evidencia y trabajo."],
  ["superacion", "student", "Tu potencial se desbloquea cuando alineas entrenamiento, comida y descanso."],
  ["superacion", "both", "El límite real casi siempre está más allá del primer cansancio."],
  ["superacion", "student", "Sigue subiendo el estándar de tu técnica y tus resultados despegarán."],
  ["superacion", "both", "Hoy es una excelente oportunidad para dejar atrás una vieja excusa."],

  // ================= NUTRICIÓN (30) =================
  ["nutricion", "both", "Entrenas una hora al día; te nutres las otras veintitrés."],
  ["nutricion", "student", "Comer con intención es una forma directa de respetar tu esfuerzo en el gym."],
  ["nutricion", "both", "La proteína construye, los carbohidratos impulsan y el agua sostiene tu rendimiento."],
  ["nutricion", "student", "Preparar tus comidas hoy te ahorra malas decisiones cuando llegue el hambre."],
  ["nutricion", "coach", "Un plan nutricional realista y flexible siempre supera a una dieta extrema."],
  ["nutricion", "both", "Nutrirte bien no es castigo; es combustible de primera calidad."],
  ["nutricion", "student", "Cada vaso de agua suma energía, foco y mejor recuperación muscular."],
  ["nutricion", "both", "La adherencia nutricional gana más físicos que la restricción perfecta."],
  ["nutricion", "student", "Cumple tu meta de proteína hoy y tu cuerpo te lo devolverá en fuerza."],
  ["nutricion", "both", "Un plato balanceado es la extensión natural de una gran sesión de fuerza."],
  ["nutricion", "student", "Si una comida salió del plan, la siguiente vuelve al camino sin culpa."],
  ["nutricion", "coach", "Educar en porciones e intercambios empodera a tus alumnos para siempre."],
  ["nutricion", "both", "Hidratación constante: rendimiento claro de principio a fin."],
  ["nutricion", "student", "Elige alimentos que te den energía para entrenar, no sueño después de comer."],
  ["nutricion", "both", "La cocina ordenada es el mejor gimnasio silencioso."],
  ["nutricion", "student", "Tu músculo necesita materia prima de calidad para crecer y definirse."],
  ["nutricion", "both", "Come para rendir, recuperarte y sentirte bien todos los días."],
  ["nutricion", "student", "Planifica tu desayuno y arrancarás el día con ventaja."],
  ["nutricion", "coach", "Ajustar macros a tiempo evita estancamientos y mantiene la motivación alta."],
  ["nutricion", "both", "Sencillez, variedad y constancia en tu plato."],
  ["nutricion", "student", "Cada comida marcada hoy acerca tus medidas a tu objetivo."],
  ["nutricion", "both", "El cuerpo refleja con honestidad lo que le das cada día."],
  ["nutricion", "student", "No busques prohibiciones imposibles; busca equilibrio inteligente."],
  ["nutricion", "both", "Buen combustible, mejores levantamientos."],
  ["nutricion", "student", "Mastica con calma, hidrátate bien y disfruta tu proceso."],
  ["nutricion", "coach", "La nutrición clara elimina la ansiedad y multiplica los resultados."],
  ["nutricion", "both", "Tu energía de mañana empieza en la cena de hoy."],
  ["nutricion", "student", "Usa tus opciones de intercambio y mantén tu plan vivo y disfrutable."],
  ["nutricion", "both", "La salud metabólica es la base de cualquier objetivo estético."],
  ["nutricion", "student", "Come como el atleta en el que te estás convirtiendo."],

  // ================= RECUPERACIÓN (30) =================
  ["recuperacion", "both", "El músculo se estimula entrenando, pero crece mientras descansas."],
  ["recuperacion", "student", "Dormir bien es el suplemento más poderoso y gratuito que existe."],
  ["recuperacion", "both", "Respetar tus días de descanso también es parte de la disciplina."],
  ["recuperacion", "student", "Escucha a tu cuerpo: recuperar a tiempo te permite entrenar toda la vida."],
  ["recuperacion", "coach", "Programar descargas inteligentes protege a tus alumnos y acelera sus marcas."],
  ["recuperacion", "both", "Siete a ocho horas de sueño profundo multiplican tu fuerza y tu claridad."],
  ["recuperacion", "student", "Estira, respira y dale calma a tu sistema nervioso después de entrenar."],
  ["recuperacion", "both", "Descansar sin culpa te devuelve al gimnasio con potencia real."],
  ["recuperacion", "student", "La movilidad de hoy evita las lesiones de mañana."],
  ["recuperacion", "both", "Recuperación de calidad significa entrenamientos de calidad."],
  ["recuperacion", "student", "No confundas estar ocupado con progresar: el cuerpo necesita pausas."],
  ["recuperacion", "coach", "Un coach que cuida la recuperación construye atletas longevos."],
  ["recuperacion", "both", "Baja revoluciones por la noche para rendir al máximo por la mañana."],
  ["recuperacion", "student", "Caminar suave en tu día libre activa la circulación y despeja la mente."],
  ["recuperacion", "both", "Pausa consciente hoy, rendimiento explosivo mañana."],
  ["recuperacion", "student", "Tu progreso agradece tanto el esfuerzo intenso como el sueño reparador."],
  ["recuperacion", "both", "Cuidar tus articulaciones es invertir en tu futuro físico."],
  ["recuperacion", "student", "Respeta los segundos de descanso entre series: ahí recuperas tu fuerza."],
  ["recuperacion", "coach", "Monitorear fatiga y molestias hace la diferencia entre un plan genérico y uno profesional."],
  ["recuperacion", "both", "La longevidad deportiva es el premio de entrenar con inteligencia."],
  ["recuperacion", "student", "Hidrátate, cena ligero y desconecta pantallas antes de dormir."],
  ["recuperacion", "both", "Recuperarte bien te permite sostener la constancia todo el año."],
  ["recuperacion", "student", "Si hoy toca descanso activo, ejecútalo con el mismo compromiso."],
  ["recuperacion", "both", "Calma en el cuerpo, foco en la mente."],
  ["recuperacion", "student", "Cada noche de buen descanso recarga tus hormonas y tu ánimo."],
  ["recuperacion", "coach", "Enseñar a descansar bien es tan valioso como enseñar a levantar pesado."],
  ["recuperacion", "both", "Cuida tu espalda, tus rodillas y tu sueño como tesoros."],
  ["recuperacion", "student", "Volver fresco a la siguiente sesión vale más que acumular fatiga vacía."],
  ["recuperacion", "both", "Equilibrio entre tensión y recuperación: la fórmula del rendimiento."],
  ["recuperacion", "student", "Agradece a tu cuerpo todo lo que hoy te permitió hacer."],

  // ================= ENFOQUE (30) =================
  ["enfoque", "both", "Una serie a la vez, una comida a la vez, un día a la vez."],
  ["enfoque", "student", "Deja el ruido afuera: esta hora es completamente tuya."],
  ["enfoque", "both", "Menos prisa, más conexión mente-músculo."],
  ["enfoque", "student", "Concéntrate en la técnica perfecta y el resultado llegará solo."],
  ["enfoque", "coach", "Claridad en tu sistema, impacto real en cada alumno que atiendes."],
  ["enfoque", "both", "Lo que mides con atención, mejora con precisión."],
  ["enfoque", "student", "No mires el reloj con prisa; haz que cada minuto en el gimnasio cuente."],
  ["enfoque", "both", "Enfócate en ejecutar el plan de hoy; el mes se construye solo."],
  ["enfoque", "coach", "Cada expediente organizado te da más tiempo para entrenar y crecer."],
  ["enfoque", "student", "Cero distracciones entre series: respira, visualiza y ejecuta."],
  ["enfoque", "both", "La atención plena convierte un ejercicio común en un estímulo superior."],
  ["enfoque", "student", "Ten clara tu meta antes de tocar la primera mancuerna."],
  ["enfoque", "both", "Prioriza lo esencial: técnica, progresión, comida y descanso."],
  ["enfoque", "coach", "Un negocio fitness ordenado te permite dar un servicio de primer nivel."],
  ["enfoque", "student", "Anota tus cargas hoy para superarlas con cabeza la próxima semana."],
  ["enfoque", "both", "Dirección clara siempre vence a la velocidad sin rumbo."],
  ["enfoque", "student", "Cada detalle en tu postura suma seguridad y resultados."],
  ["enfoque", "both", "Reduce el ruido, aumenta la ejecución."],
  ["enfoque", "coach", "Escuchar a tus alumnos con atención transforma tu coaching en referente."],
  ["enfoque", "student", "Mantén la vista en tu propio carril y avanza con seguridad."],
  ["enfoque", "both", "Un objetivo medible te da un motivo concreto cada mañana."],
  ["enfoque", "student", "Hoy toca cumplir lo que está en tu pantalla, paso a paso."],
  ["enfoque", "both", "La simplicidad ejecutada con enfoque supera cualquier método complicado."],
  ["enfoque", "coach", "Dedica energía a lo que realmente mueve la aguja para tus clientes."],
  ["enfoque", "student", "Visualiza la repetición limpia antes de iniciar el movimiento."],
  ["enfoque", "both", "Cuando sabes por qué entrenas, encuentras cómo hacerlo."],
  ["enfoque", "student", "Respira profundo, ajusta tu agarre y haz que esta serie cuente."],
  ["enfoque", "both", "El foco sostenido convierte metas ambiciosas en rutinas alcanzables."],
  ["enfoque", "coach", "Lidera con datos claros, empatía y visión de largo plazo."],
  ["enfoque", "both", "Hoy es un buen día para avanzar con intención."],
];

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = RAW_QUOTES.map(
  ([category, audience, text], idx) => ({
    id: `q-${String(idx + 1).padStart(3, "0")}`,
    text,
    category,
    audience,
  })
);

export function getQuotesForAudience(role: "coach" | "student"): MotivationalQuote[] {
  return MOTIVATIONAL_QUOTES.filter(
    (q) => q.audience === "both" || q.audience === role
  );
}

export function getDailyQuote(role: "coach" | "student", offset = 0): MotivationalQuote {
  const pool = getQuotesForAudience(role);
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const idx = (dayOfYear + offset) % pool.length;
  return pool[idx >= 0 ? idx : 0];
}

export function getQuoteById(id?: string | null): MotivationalQuote | undefined {
  if (!id) return undefined;
  return MOTIVATIONAL_QUOTES.find((q) => q.id === id);
}
