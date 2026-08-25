import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type PolicyBlock =
  | { readonly type: 'p'; readonly text: string }
  | { readonly type: 'subheading'; readonly text: string }
  | { readonly type: 'ul'; readonly items: readonly string[] }
  | { readonly type: 'ol'; readonly items: readonly string[] };

interface PolicySection {
  readonly heading: string;
  readonly blocks: readonly PolicyBlock[];
}

function p(text: string): PolicyBlock {
  return { type: 'p', text };
}
function sub(text: string): PolicyBlock {
  return { type: 'subheading', text };
}
function ul(items: readonly string[]): PolicyBlock {
  return { type: 'ul', items };
}
function ol(items: readonly string[]): PolicyBlock {
  return { type: 'ol', items };
}

const SECTIONS: readonly PolicySection[] = [
  {
    heading: '1. Identificación del responsable del tratamiento',
    blocks: [
      p(
        'En cumplimiento de la Constitución Política de Colombia, la Ley Estatutaria 1581 de 2012, sus decretos reglamentarios incorporados en el Decreto 1074 de 2015 y demás normas que las modifiquen, adicionen o sustituyan, LostAnimals, en adelante «la Plataforma», «la Compañía» o «el Responsable», adopta la presente Política de Tratamiento y Protección de Datos Personales.',
      ),
      p(
        'Esta Política establece las condiciones bajo las cuales se recolectan, almacenan, utilizan, consultan, transmiten, circulan, actualizan, protegen y, cuando corresponda, eliminan los datos personales de los usuarios de la Plataforma.',
      ),
    ],
  },
  {
    heading: '2. Marco normativo',
    blocks: [
      p('Esta Política se adopta principalmente con fundamento en:'),
      ul([
        'Los artículos 15 y 20 de la Constitución Política de Colombia.',
        'La Ley Estatutaria 1581 de 2012, por la cual se dictan disposiciones generales para la protección de datos personales.',
        'El Decreto 1074 de 2015, en las disposiciones reglamentarias aplicables a la protección de datos personales.',
        'Las circulares, instrucciones y demás disposiciones emitidas por la Superintendencia de Industria y Comercio —SIC—, en su calidad de autoridad colombiana de protección de datos personales.',
        'Las demás normas colombianas que modifiquen, adicionen, reglamenten o sustituyan las anteriores.',
      ]),
      p(
        'Como buenas prácticas de gestión, seguridad y privacidad, el Responsable podrá adoptar controles inspirados en estándares internacionales reconocidos, entre ellos ISO/IEC 27001, ISO/IEC 27701 y principios internacionales de privacidad, seguridad de la información, minimización de datos, privacidad desde el diseño y responsabilidad demostrada.',
      ),
      p(
        'La referencia a estos estándares no implica necesariamente que el Responsable se encuentre certificado bajo ellos, salvo que así se informe expresamente.',
      ),
    ],
  },
  {
    heading: '3. Ámbito de aplicación',
    blocks: [
      p('La presente Política aplica a los datos personales tratados por el Responsable a través de:'),
      ul([
        'El sitio web.',
        'Aplicaciones web o móviles asociadas.',
        'Formularios de registro.',
        'Sistemas de autenticación.',
        'Servicios de inicio de sesión mediante terceros, como Google.',
        'Servicios de notificaciones.',
        'Sistemas de soporte y atención al usuario.',
        'Infraestructura tecnológica, bases de datos y sistemas relacionados con la operación de la Plataforma.',
      ]),
      p(
        'Aplica igualmente a cualquier base de datos o archivo que contenga información personal respecto de la cual LostAnimals actúe como Responsable del Tratamiento.',
      ),
    ],
  },
  {
    heading: '4. Principios aplicables al tratamiento',
    blocks: [
      p('El tratamiento de datos personales se realizará atendiendo, entre otros, los siguientes principios:'),
      sub('4.1. Legalidad'),
      p('El tratamiento de datos personales se realizará de conformidad con la legislación colombiana aplicable.'),
      sub('4.2. Finalidad'),
      p('Los datos serán tratados exclusivamente para finalidades legítimas, específicas e informadas al Titular.'),
      sub('4.3. Libertad'),
      p('Salvo las excepciones previstas legalmente, el tratamiento se efectuará con autorización previa, expresa e informada del Titular.'),
      sub('4.4. Veracidad y calidad'),
      p('Se procurará que los datos tratados sean veraces, completos, exactos, actualizados, comprobables y comprensibles.'),
      sub('4.5. Transparencia'),
      p('Los Titulares podrán obtener información sobre la existencia y tratamiento de sus datos personales, de conformidad con la legislación aplicable.'),
      sub('4.6. Acceso y circulación restringida'),
      p('Los datos personales serán tratados únicamente por personas autorizadas y no serán divulgados públicamente salvo autorización del Titular, obligación legal o cuando por su naturaleza sean datos públicos.'),
      sub('4.7. Seguridad'),
      p('El Responsable aplicará medidas técnicas, humanas, administrativas y organizacionales razonables y apropiadas al riesgo para proteger los datos contra pérdida, uso indebido, acceso no autorizado, alteración, divulgación o destrucción.'),
      sub('4.8. Confidencialidad'),
      p('Las personas que intervengan en el tratamiento deberán mantener la confidencialidad de la información incluso después de finalizar su relación con el Responsable, cuando corresponda.'),
      sub('4.9. Minimización'),
      p('La Plataforma procurará recolectar únicamente los datos razonablemente necesarios para las finalidades informadas.'),
      sub('4.10. Limitación de conservación'),
      p('Los datos no serán conservados indefinidamente cuando hayan dejado de ser necesarios para las finalidades autorizadas, salvo que exista una obligación legal, contractual, administrativa, probatoria o de seguridad que justifique su conservación.'),
      sub('4.11. Privacidad y seguridad desde el diseño'),
      p('Cuando resulte aplicable, el Responsable procurará incorporar consideraciones de privacidad y seguridad desde las etapas de diseño y desarrollo de sus servicios y funcionalidades.'),
    ],
  },
  {
    heading: '5. Datos personales que tratamos',
    blocks: [
      p('Dependiendo de la forma en que el usuario interactúe con la Plataforma, podrán tratarse las siguientes categorías de información.'),
      sub('5.1. Datos de identificación y cuenta'),
      p('La Plataforma podrá recolectar y tratar:'),
      ul([
        'Correo electrónico.',
        'Nombre o nombre visible.',
        'Número de documento de identidad o cédula.',
        'Número telefónico.',
        'Identificador único interno o UUID.',
        'Rol o nivel de permisos dentro de la Plataforma.',
        'Fecha de creación de la cuenta.',
        'Fecha y estado de verificación.',
        'Registros relacionados con la aceptación o autorización para el tratamiento de datos personales, incluyendo fecha y demás evidencia técnica razonablemente necesaria para demostrarla.',
      ]),
      sub('5.2. Credenciales de autenticación'),
      p('Las contraseñas de los usuarios no se almacenan en texto plano.'),
      p('La Plataforma almacena únicamente una representación criptográfica de la contraseña mediante un mecanismo de hash utilizando BCrypt, de manera que la contraseña original no sea recuperable directamente desde la base de datos.'),
      sub('5.3. Datos asociados al inicio de sesión mediante Google'),
      p('Cuando el usuario decida registrarse o iniciar sesión mediante Google, la Plataforma podrá recibir y tratar, dependiendo de los permisos otorgados y de la información suministrada por Google:'),
      ul([
        'Identificador estable de la cuenta de Google (sub).',
        'Dirección de correo electrónico, cuando corresponda.',
        'Nombre o información básica del perfil, cuando corresponda.',
        'URL o referencia de la fotografía de perfil.',
      ]),
      p('La autenticación realizada por Google se encuentra adicionalmente sujeta a las políticas y condiciones propias de Google.'),
      p('La Plataforma no recibe ni almacena la contraseña de la cuenta de Google del usuario.'),
      sub('5.4. Datos de ubicación'),
      p('Cuando una funcionalidad de la Plataforma lo requiera, podrá solicitarse al usuario autorización mediante los mecanismos del navegador, dispositivo o sistema operativo para acceder a su ubicación.'),
      p('La información de ubicación será utilizada exclusivamente para habilitar las funcionalidades que dependan de ella, tales como:'),
      ul([
        'Visualización de la posición del usuario en mapas.',
        'Funcionamiento de servicios basados en ubicación.',
        'Prestación adecuada de funcionalidades de la aplicación que razonablemente requieran conocer la ubicación del dispositivo.',
      ]),
      p('El acceso a la ubicación estará sujeto a la autorización otorgada por el usuario a través de su dispositivo o navegador.'),
      p('La Plataforma no utilizará la ubicación para finalidades publicitarias, creación de perfiles comerciales o seguimiento ajeno a las funcionalidades informadas, salvo que en el futuro se solicite una autorización específica para una finalidad diferente.'),
      p('La ubicación asociada a un reporte o avistamiento se almacena en el servidor junto con la publicación correspondiente mientras esta permanezca activa, ya que es un dato necesario para mostrarla en el mapa y habilitar la búsqueda por cercanía. La posición del dispositivo utilizada únicamente para centrar el mapa o sugerir un punto de partida no se almacena de forma separada.'),
      sub('5.5. Datos técnicos y de seguridad'),
      p('Para efectos de funcionamiento, autenticación, prevención de fraude, mantenimiento y seguridad, la infraestructura tecnológica podrá generar registros técnicos tales como:'),
      ul([
        'Identificadores técnicos de sesión.',
        'Fechas y horas de acceso.',
        'Eventos de autenticación.',
        'Registros técnicos de errores.',
        'Registros de seguridad.',
        'Información necesaria para prevenir accesos no autorizados, abusos o incidentes de seguridad.',
      ]),
      p('Estos datos se utilizarán de manera proporcional a las necesidades operativas y de seguridad de la Plataforma.'),
    ],
  },
  {
    heading: '6. Finalidades del tratamiento',
    blocks: [
      p('Los datos personales podrán ser tratados para las siguientes finalidades:'),
      ol([
        'Crear y administrar la cuenta del usuario.',
        'Identificar al usuario dentro de la Plataforma.',
        'Permitir el inicio, mantenimiento y cierre de sesiones.',
        'Verificar la identidad o información suministrada por el usuario cuando ello sea necesario para la prestación del servicio.',
        'Gestionar sistemas de autenticación propios o proporcionados por terceros, incluyendo autenticación mediante Google.',
        'Permitir el funcionamiento de las diferentes funcionalidades de la Plataforma.',
        'Mostrar información geográfica y mapas cuando el usuario habilite las funciones de ubicación.',
        'Enviar notificaciones funcionales, operativas, transaccionales o de seguridad relacionadas con el servicio.',
        'Gestionar procesos de verificación de cuentas.',
        'Brindar soporte técnico y atender solicitudes de los usuarios.',
        'Mantener la seguridad e integridad de la Plataforma.',
        'Prevenir, detectar, investigar y mitigar actividades fraudulentas, accesos no autorizados, abusos, ataques informáticos u otras conductas que puedan comprometer la seguridad de los usuarios o de la Plataforma.',
        'Realizar labores técnicas de mantenimiento, diagnóstico, auditoría y solución de errores.',
        'Cumplir obligaciones legales, regulatorias, judiciales o administrativas.',
        'Atender requerimientos de autoridades públicas competentes cuando legalmente corresponda.',
        'Gestionar solicitudes, consultas y reclamos relacionados con protección de datos personales.',
        'Conservar evidencia de las autorizaciones otorgadas por los Titulares.',
        'Defender los derechos e intereses legítimos del Responsable o de sus usuarios ante reclamaciones, procedimientos administrativos o judiciales, dentro de los límites permitidos por la ley.',
      ]),
      p('Los datos personales no serán utilizados para una finalidad materialmente diferente a las aquí descritas sin informar previamente al Titular y, cuando sea legalmente necesario, obtener una nueva autorización.'),
    ],
  },
  {
    heading: '7. Autorización del titular',
    blocks: [
      p('Salvo que exista una excepción legal, la Plataforma solicitará autorización previa, expresa e informada para el tratamiento de los datos personales.'),
      p('La autorización podrá obtenerse mediante:'),
      ul([
        'Casillas de aceptación no premarcadas.',
        'Formularios electrónicos.',
        'Acciones inequívocas realizadas por el usuario.',
        'Mecanismos electrónicos que permitan dejar evidencia de la autorización.',
        'Cualquier otro medio permitido por la legislación colombiana.',
      ]),
      p('La Plataforma conservará evidencia de la autorización otorgada, incluyendo cuando resulte pertinente la fecha y la versión de los documentos aceptados.'),
      p('La aceptación de los Términos y Condiciones de Uso y la autorización para el tratamiento de datos personales podrán presentarse conjuntamente desde el punto de vista de interfaz, pero deberán permitir identificar de manera clara que el Titular está otorgando su autorización informada para el tratamiento de sus datos.'),
    ],
  },
  {
    heading: '8. Información de ubicación y permisos del dispositivo',
    blocks: [
      p('El usuario conserva el control sobre los permisos de ubicación otorgados mediante su dispositivo, navegador o sistema operativo.'),
      p('El usuario podrá revocar dichos permisos desde la configuración correspondiente.'),
      p('La revocatoria de un permiso de ubicación podrá ocasionar que algunas funcionalidades de la Plataforma que dependen técnicamente de dicha información dejen de estar disponibles o no funcionen correctamente.'),
      p('La Plataforma procurará aplicar el principio de minimización al tratamiento de información geográfica y limitar su uso a aquello estrictamente relacionado con la funcionalidad solicitada por el usuario.'),
      p('Cuando resulte técnicamente viable, se preferirá el procesamiento temporal o limitado de la ubicación frente a su almacenamiento permanente.'),
    ],
  },
  {
    heading: '9. Información sensible',
    blocks: [
      p('La Plataforma no tiene como finalidad ordinaria recolectar datos sensibles tales como información relativa a la salud, origen racial o étnico, orientación política, convicciones religiosas o filosóficas, afiliación sindical, vida sexual o datos biométricos destinados a identificar inequívocamente a una persona.'),
      p('En caso de que alguna funcionalidad futura implique el tratamiento de datos considerados sensibles conforme a la legislación colombiana, se informará previamente al Titular:'),
      ul([
        'La naturaleza sensible de dichos datos.',
        'La finalidad específica de su tratamiento.',
        'El carácter facultativo de suministrarlos cuando corresponda.',
        'Las condiciones particulares de tratamiento.',
      ]),
      p('Y se solicitará autorización explícita cuando legalmente sea requerida.'),
    ],
  },
  {
    heading: '10. Información de niños, niñas y adolescentes',
    blocks: [
      p('La Plataforma no está dirigida intencionalmente a menores de edad y no busca recolectar de manera deliberada sus datos personales.'),
      p('Si el Responsable identifica que ha recolectado información de un menor sin cumplir los requisitos legales correspondientes, adoptará las medidas pertinentes para restringir o eliminar dicha información, según resulte legalmente procedente.'),
      p('Si en el futuro se habilitan servicios dirigidos a niños, niñas o adolescentes, su información será tratada atendiendo su interés superior, el respeto de sus derechos fundamentales y los demás requisitos establecidos por la legislación colombiana.'),
    ],
  },
  {
    heading: '11. Terceros y encargados del tratamiento',
    blocks: [
      p('Para prestar sus servicios, la Plataforma utiliza proveedores tecnológicos que podrán actuar como Encargados del Tratamiento o, en determinadas operaciones, como responsables independientes de sus propios tratamientos.'),
      p('Actualmente se utilizan, entre otros:'),
      sub('11.1. Amazon Web Services — AWS'),
      p('Se utiliza infraestructura tecnológica de Amazon Web Services (AWS) para alojamiento, almacenamiento, bases de datos y/o otros servicios de infraestructura necesarios para operar la Plataforma.'),
      p('El Responsable configura controles técnicos y de acceso destinados a restringir el acceso a la información y proteger los datos almacenados en dicha infraestructura.'),
      p('El uso de AWS podrá implicar tratamiento o transmisión de información mediante infraestructura ubicada fuera de Colombia, de conformidad con las configuraciones utilizadas y la legislación aplicable.'),
      sub('11.2. Google'),
      p('Se utilizan servicios de Google para funcionalidades que pueden incluir:'),
      ul([
        'Inicio de sesión o autenticación mediante Google.',
        'Identificación de la cuenta mediante el identificador estable suministrado por Google.',
        'Notificaciones y servicios tecnológicos relacionados.',
      ]),
      p('La información tratada directamente por Google se encuentra adicionalmente sometida a sus propios términos, políticas de privacidad y medidas de seguridad.'),
      p('El Responsable procurará limitar la información comunicada a Google a aquella necesaria para prestar las funcionalidades correspondientes.'),
    ],
  },
  {
    heading: '12. Transmisión y transferencia internacional de datos',
    blocks: [
      p('Debido a la utilización de proveedores tecnológicos globales como AWS y Google, determinados datos personales podrán ser tratados mediante infraestructura tecnológica o proveedores ubicados fuera de Colombia.'),
      p('Cuando un tercero trate datos personales por cuenta y bajo las instrucciones del Responsable, se procurará establecer las obligaciones correspondientes mediante términos contractuales, acuerdos de tratamiento de datos u otros instrumentos jurídicos aplicables.'),
      p('Estas relaciones deberán contemplar, cuando corresponda:'),
      ul([
        'El objeto y alcance del tratamiento.',
        'Las finalidades autorizadas.',
        'Las obligaciones de confidencialidad.',
        'Las medidas de seguridad aplicables.',
        'Las restricciones respecto del uso de los datos.',
        'Las obligaciones relacionadas con incidentes de seguridad.',
        'La devolución, eliminación o conservación de la información al finalizar la prestación del servicio, cuando corresponda.',
      ]),
      p('Las transferencias y transmisiones internacionales de datos se efectuarán de conformidad con las disposiciones colombianas aplicables.'),
    ],
  },
  {
    heading: '13. Cookies y tecnologías similares',
    blocks: [
      p('Actualmente, la Plataforma no utiliza cookies con fines publicitarios, de perfilamiento comercial o analítica comportamental propias destinadas a rastrear directamente la actividad del usuario para dichas finalidades.'),
      p('No obstante, determinadas funcionalidades técnicas, sistemas de autenticación, proveedores externos o servicios integrados podrían utilizar identificadores, almacenamiento local, tokens u otras tecnologías estrictamente necesarias para:'),
      ul([
        'Mantener sesiones.',
        'Realizar procesos de autenticación.',
        'Proteger la seguridad del servicio.',
        'Recordar información estrictamente necesaria para el funcionamiento.',
        'Permitir integraciones de terceros solicitadas por el usuario.',
      ]),
      p('Los servicios proporcionados por terceros, particularmente Google, podrán utilizar sus propias tecnologías conforme a sus respectivas políticas.'),
      p('Si en el futuro la Plataforma incorpora cookies analíticas, publicitarias o de seguimiento no esenciales, actualizará esta Política y, cuando corresponda, implementará mecanismos específicos para gestionar el consentimiento del usuario.'),
    ],
  },
  {
    heading: '14. Seguridad de la información',
    blocks: [
      p('La seguridad de la información constituye un componente esencial del tratamiento de datos personales.'),
      p('El Responsable implementa o procurará mantener, de acuerdo con su naturaleza, recursos, nivel de riesgo y evolución tecnológica, medidas administrativas, técnicas y organizacionales razonables destinadas a preservar la confidencialidad, integridad y disponibilidad de la información.'),
      p('Entre las medidas actualmente aplicadas se encuentran:'),
      sub('14.1. Contraseñas'),
      p('Las contraseñas no se almacenan en texto plano. Se almacena únicamente su hash mediante BCrypt.'),
      sub('14.2. Teléfono'),
      p('El número telefónico se almacena utilizando cifrado AES-256-GCM.'),
      sub('14.3. Documento de identidad'),
      p('El número de documento o cédula se almacena utilizando cifrado AES-256-GCM.'),
      sub('14.4. Bases de datos e infraestructura'),
      p('Las bases de datos y demás infraestructura desplegada sobre AWS se mantienen con mecanismos de cifrado, controles de acceso y políticas de seguridad configuradas para restringir el acceso a personal o servicios autorizados.'),
      sub('14.5. Control de acceso'),
      p('Se aplican mecanismos destinados a restringir el acceso a información personal conforme a las funciones, roles y necesidades operativas.'),
      sub('14.6. Comunicaciones'),
      p('La Plataforma procurará utilizar protocolos seguros, incluyendo HTTPS/TLS, para la transmisión de información entre los usuarios y sus sistemas.'),
      sub('14.7. Gestión de riesgos'),
      p('El Responsable podrá adoptar progresivamente controles inspirados en buenas prácticas internacionales de seguridad y privacidad, incluyendo principios contenidos en ISO/IEC 27001 e ISO/IEC 27701.'),
      p('Ningún sistema informático puede garantizar una seguridad absoluta. Por ello, el Responsable revisará razonablemente sus mecanismos de protección y procurará adecuarlos a los riesgos identificados y al estado de la tecnología.'),
    ],
  },
  {
    heading: '15. Incidentes de seguridad',
    blocks: [
      p('Cuando el Responsable tenga conocimiento de un incidente de seguridad que pueda comprometer datos personales, realizará una evaluación razonable de su naturaleza, alcance y posibles consecuencias.'),
      p('Dependiendo de las circunstancias y de las obligaciones legales aplicables, podrá:'),
      ul([
        'Contener y mitigar el incidente.',
        'Investigar su origen.',
        'Adoptar medidas correctivas.',
        'Conservar la evidencia necesaria.',
        'Informar a las autoridades competentes cuando sea legalmente exigible.',
        'Comunicar la situación a los Titulares afectados cuando resulte necesario o apropiado conforme a la legislación aplicable y al nivel de riesgo.',
      ]),
      p('El Responsable mantendrá procedimientos internos destinados a gestionar razonablemente los incidentes relacionados con seguridad y privacidad.'),
    ],
  },
  {
    heading: '16. Conservación de la información',
    blocks: [
      p('Los datos personales serán conservados durante el período razonablemente necesario para cumplir las finalidades para las cuales fueron recolectados.'),
      p('Como regla general, la información asociada a una cuenta podrá conservarse mientras la cuenta permanezca activa.'),
      p('Después de la eliminación o cierre de una cuenta, determinada información podrá conservarse durante un período adicional cuando resulte necesario para:'),
      ul([
        'Cumplir obligaciones legales.',
        'Atender requerimientos de autoridades.',
        'Resolver disputas.',
        'Prevenir fraude o abuso.',
        'Gestionar incidentes de seguridad.',
        'Defender derechos en procedimientos judiciales o administrativos.',
        'Mantener evidencia del consentimiento otorgado.',
        'Cumplir otras obligaciones legítimas de conservación.',
      ]),
      p('Cuando los datos dejen de resultar necesarios y no exista una obligación que justifique su conservación, serán eliminados, anonimizados o sometidos a procedimientos razonables destinados a impedir su utilización ordinaria.'),
    ],
  },
  {
    heading: '17. Derechos de los titulares',
    blocks: [
      p('De acuerdo con la legislación colombiana, los Titulares podrán ejercer, entre otros, los siguientes derechos:'),
      ol([
        'Conocer, actualizar y rectificar sus datos personales.',
        'Solicitar prueba de la autorización otorgada, salvo los casos en los que legalmente no sea necesaria.',
        'Ser informados, previa solicitud, respecto del uso dado a sus datos personales.',
        'Presentar ante la Superintendencia de Industria y Comercio quejas por infracciones a la legislación de protección de datos, una vez agotado el procedimiento correspondiente ante el Responsable cuando ello sea exigible.',
        'Revocar la autorización y/o solicitar la supresión de sus datos cuando sea procedente.',
        'Acceder gratuitamente a sus datos personales que hayan sido objeto de tratamiento, conforme a las condiciones establecidas por la ley.',
        'Solicitar la corrección de datos incompletos, incorrectos o desactualizados.',
      ]),
      p('La revocatoria de la autorización o la eliminación de datos no procederá cuando exista un deber legal o contractual que exija su permanencia o tratamiento.'),
    ],
  },
  {
    heading: '18. Procedimiento para consultas',
    blocks: [
      p('El Titular, sus causahabientes o las personas legalmente autorizadas podrán consultar la información personal que repose en las bases de datos del Responsable.'),
      p('Las consultas podrán dirigirse a través de los canales de soporte o contacto que la Plataforma ponga a disposición de los usuarios.'),
      p('El Responsable atenderá las consultas dentro de los plazos establecidos por la legislación colombiana vigente.'),
      p('Cuando no resulte posible atender la consulta dentro del término legal inicial, se informará al solicitante sobre las razones de la demora y la fecha en que será atendida, sin superar los límites establecidos por la ley.'),
    ],
  },
  {
    heading: '19. Procedimiento para reclamos',
    blocks: [
      p('Cuando el Titular considere que la información contenida en una base de datos debe ser corregida, actualizada o eliminada, o cuando advierta un posible incumplimiento de las obligaciones en materia de protección de datos, podrá presentar un reclamo ante el Responsable.'),
      p('La solicitud deberá incluir, como mínimo:'),
      ul([
        'Identificación del Titular.',
        'Descripción de los hechos que originan el reclamo.',
        'Información de contacto para recibir respuesta.',
        'Documentos o elementos que pretenda hacer valer, cuando corresponda.',
      ]),
      p('El Responsable podrá solicitar que se subsane una solicitud incompleta conforme a las reglas y términos establecidos en la legislación aplicable.'),
      p('Los reclamos serán atendidos dentro de los términos previstos por la Ley 1581 de 2012 y sus normas reglamentarias.'),
    ],
  },
  {
    heading: '20. Solicitud de supresión de cuenta y datos',
    blocks: [
      p('El usuario podrá solicitar la eliminación de su cuenta y, cuando legalmente proceda, de sus datos personales, utilizando los mecanismos disponibles dentro de la Plataforma o los canales de contacto que esta ponga a disposición.'),
      p('La eliminación de la cuenta no necesariamente implica la destrucción inmediata de toda la información.'),
      p('El Responsable podrá conservar determinados registros cuando exista una obligación legal o contractual, una necesidad razonable de seguridad, prevención de fraude, defensa judicial, cumplimiento regulatorio o conservación de evidencia de las autorizaciones otorgadas.'),
      p('Cuando dicha justificación finalice, la información será eliminada o anonimizada de conformidad con los procedimientos internos establecidos.'),
    ],
  },
  {
    heading: '21. Revocatoria del consentimiento',
    blocks: [
      p('Cuando legalmente sea procedente, el Titular podrá solicitar la revocatoria de la autorización otorgada para determinados tratamientos.'),
      p('La revocatoria podrá ser total o referirse a determinadas finalidades.'),
      p('Si la información es indispensable para ejecutar una relación contractual solicitada por el usuario, cumplir una obligación legal o prestar una funcionalidad esencial de la Plataforma, la revocatoria podrá implicar la imposibilidad de continuar prestando dicho servicio.'),
    ],
  },
  {
    heading: '22. Información suministrada a autoridades',
    blocks: [
      p('El Responsable podrá suministrar información personal cuando:'),
      ul([
        'Exista una orden judicial.',
        'Sea requerida por una autoridad pública o administrativa competente en ejercicio de sus funciones legales.',
        'Exista otra obligación o autorización establecida por la legislación aplicable.',
      ]),
      p('En dichos casos se procurará limitar la información suministrada a aquella razonablemente necesaria para atender el requerimiento correspondiente.'),
    ],
  },
  {
    heading: '23. No comercialización de datos personales',
    blocks: [
      p('El Responsable no vende ni comercializa bases de datos personales de sus usuarios a anunciantes, corredores de datos u otros terceros para que estos desarrollen actividades de publicidad independiente.'),
      p('Cualquier modificación futura de esta práctica requerirá la revisión de esta Política y, cuando corresponda legalmente, la obtención de una autorización adicional del Titular.'),
    ],
  },
  {
    heading: '24. Responsabilidad demostrada',
    blocks: [
      p('El Responsable procurará adoptar mecanismos internos que permitan demostrar el cumplimiento de sus obligaciones en materia de protección de datos personales, teniendo en cuenta la naturaleza y dimensión de sus operaciones.'),
      p('Estos mecanismos podrán incluir:'),
      ul([
        'Registro de autorizaciones.',
        'Control de acceso.',
        'Gestión de proveedores y Encargados del Tratamiento.',
        'Políticas internas de seguridad.',
        'Gestión de incidentes.',
        'Revisión de permisos.',
        'Gestión de riesgos.',
        'Procedimientos de atención de derechos de los Titulares.',
        'Revisión periódica de las finalidades de tratamiento.',
        'Eliminación o anonimización de información innecesaria.',
        'Capacitación del personal autorizado, cuando corresponda.',
      ]),
    ],
  },
  {
    heading: '25. Cambios a esta Política',
    blocks: [
      p('El Responsable podrá modificar esta Política para adaptarla a:'),
      ul([
        'Cambios legales o regulatorios.',
        'Nuevas instrucciones de autoridades competentes.',
        'Modificaciones tecnológicas.',
        'Nuevos proveedores.',
        'Nuevas funcionalidades.',
        'Cambios relevantes en las finalidades del tratamiento.',
      ]),
      p('La versión vigente estará disponible en la Plataforma indicando su fecha de actualización.'),
      p('Cuando una modificación implique una nueva finalidad que requiera autorización del Titular, el Responsable solicitará una nueva autorización cuando legalmente corresponda.'),
    ],
  },
  {
    heading: '26. Autoridad de protección de datos',
    blocks: [
      p('La autoridad colombiana competente en materia de protección de datos personales es la Superintendencia de Industria y Comercio —SIC—.'),
      p('Antes de presentar una queja ante la autoridad cuando la legislación así lo requiera, el Titular deberá haber agotado el trámite correspondiente de consulta o reclamo ante el Responsable o Encargado del Tratamiento.'),
    ],
  },
  {
    heading: '27. Vigencia',
    blocks: [
      p('La presente Política entra en vigencia desde su publicación en la Plataforma.'),
      p('Las bases de datos sujetas a esta Política permanecerán vigentes durante el tiempo necesario para cumplir las finalidades de su tratamiento y las obligaciones legales o contractuales aplicables.'),
    ],
  },
];

/**
 * Popup con el texto completo de la Política de Tratamiento y Protección de Datos
 * Personales (Ley 1581 de 2012), enlazado desde el registro junto al checkbox de
 * aceptación. Se abre vía `open()` desde el padre.
 */
@Component({
  selector: 'app-data-policy-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" (click)="close()">
        <div
          class="card flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <div class="flex flex-col gap-1">
            <h2 class="text-xl font-bold tracking-tight text-[var(--color-primary-strong)]">
              Política de Tratamiento y Protección de Datos Personales
            </h2>
            <p class="text-xs text-[var(--color-text)] opacity-60">Versión 1.0</p>
          </div>

          @for (section of sections; track section.heading) {
            <section class="flex flex-col gap-2">
              <h3 class="text-base font-bold text-[var(--color-primary-strong)]">{{ section.heading }}</h3>
              @for (block of section.blocks; track $index) {
                @switch (block.type) {
                  @case ('p') {
                    <p class="text-sm text-[var(--color-text)] opacity-90">{{ block.text }}</p>
                  }
                  @case ('subheading') {
                    <h4 class="text-sm font-semibold text-[var(--color-primary-strong)]">{{ block.text }}</h4>
                  }
                  @case ('ul') {
                    <ul class="flex flex-col gap-1 pl-5 text-sm text-[var(--color-text)] opacity-90" style="list-style: disc;">
                      @for (item of block.items; track item) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  }
                  @case ('ol') {
                    <ol class="flex flex-col gap-1 pl-5 text-sm text-[var(--color-text)] opacity-90" style="list-style: decimal;">
                      @for (item of block.items; track item) {
                        <li>{{ item }}</li>
                      }
                    </ol>
                  }
                }
              }
            </section>
          }

          <button type="button" (click)="close()" class="btn btn-primary mt-1">Cerrar</button>
        </div>
      </div>
    }
  `,
})
export class DataPolicyModal {
  protected readonly sections = SECTIONS;
  protected readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
