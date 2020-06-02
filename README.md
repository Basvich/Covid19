# Simulador propagación infección
## TOC
- [Simulador propagación infección](#simulador-propagaci-n-infecci-n)
  * [Introducción](#introducci-n)
  * [Elementos técnicos](#elementos-t-cnicos)
    + [Angular](#angular)
    + [Bootstrap](#bootstrap)
    + [P5*js](#p5-js)
    + [ChartJs](#chartjs)
    + [Otros](#otros)
  * [Simulación de propagación](#simulaci-n-de-propagaci-n)
    + [Distancia y contagio](#distancia-y-contagio)
      - [Inmunes iniciales](#inmunes-iniciales)
      - [No inmunidad](#no-inmunidad)
    + [Conclusiones](#conclusiones)
      - [Discrepancia con el modelo SIR](#discrepancia-con-el-modelo-sir)
        * [Influencia por distribución](#influencia-por-distribuci-n)
      - [Reinfecciones](#reinfecciones)
      - [Inmunidad de rebaño](#inmunidad-de-reba-o)
## Introducción
Hay 2 principales objetivos en la creación de este programa
- Tener a mano como reolver las típicas necesidades para realizar pequeños programas, de forma rápida eficiente y _suficientemente_ maquetado.
  - Enlaces de controles visuales a variables.
  - Tener un espacio donde pintar lo que queramos
  - Tener un componente para mostrar gráficas.
- Poder realizar una simulación de alguna enfermedad contagiosa y entender mejor los parámetros que pueden afecta y como.

Es posible ver el funcionamiento en directo usando la dirección: [**enlace en GitHub**](https://basvich.github.io/Propagation/)

## Elementos técnicos ##
### Angular ###
El marco global de la apliación, es angular 9.1 .
### Bootstrap ###
Como principal sistema para maquetado, se usó bootstrap 4.1, Que es suficientemente simple con buenos resultados sin tener que aprender demasiadas cosas.
### P5*js ###
Se usa esta librería como componente para tener un lugar donde poder pintar lo que se quiera. Es muy rápida y lo suficientemente simple como para empezar a usarla casi de inmediato.
### ChartJs ###
Es la librería usada para motrar facilmente cualquier conjunto de datos 

### Otros ### 
- Se usa una implementación simple de un KD Tree 2D para poder filtrar facilmente a los elementos cercanos a cualquier punto y no tener que recorrerlos todos en el momento de calcular la propagación

## Simulación de propagación
> **Nota**: No pretende simular exactamente los números, y que pueda dar una predicción precisa. Pero si el comportamiento general a partir de las distintas variables que pueden influir.

La simulación se realiza simplemente en pasos. En cada paso, se mira a cuantos nuevos infectados hay, y el cambio de estado en los infectados. Los cambios de estado, y todas las variables se basan en probabilidades:
- Lineales. Simplemente dada una probabilidad, se saca un valor aleatorio y ese suceso ocurre si el valor obtenido es mayor que la probabilidad. Se usa por ejemplo en la probabilidad de contagio (aunque ajustado con distancia), de ser sintomático, de morir...
- Gausianas. Se usa una (aproximación) distribución de gausiana para obtener un valor. Es muy util cuando queremeos que ciertos valores estén en torno a un valor central, pero con cierta dispersión. Se usa por ejemplo en: el cálculo de días de infección; en movimientos; en la distribución llamada _orgánica_

### Distancia y contagio ###
El concepto de '_distancia_' aunque similar a la distancia física, aqui hubo que tomar alguna libertad. Es mas parecido a lo que se entiende como _distancia social_ en el que se mezcla la distancia física, con el contacto físico en si o a traves de algún objeto común.

La propagación está directamente relacionada con esta distancia. De forma que con distancias inferiores a cierto humbral, la probabilidad de contagio es el valor indicado (90%). A partir de esa distancia, la probabilidad de contagio decae con el cuadrado de esta distancia, siendo aproximadamente nula en torno a 5 veces esta distancia mínima. Esta distancia, junto con el valor de probabilidad base es la que nos indica si un elemento resultará infectado o no. Visualmente se marca en la aplicación con un pequeño doble recuadro que sirve para visualizar esta distancia mínima y máxima.

#### Inmunes iniciales ###
Sirve para indicar un porcentaje de la población que es inmune, y que no se contagiará ni sera contagiosa. Esto puede ser usado directamente para probar la **inmunidad de rebaño**

#### No inmunidad ####
Sirve para indicar que un cierto porcentaje de los infectados al finalizar la enfermedad, no ganan inmunidad con lo que pueden volver a reinfectarse.

### Conclusiones ###
> Son consecuencias directas de la observación de esta simulación. Sin tampoco pensar en ello demasiado, e incluso hay que tener en cuenta la posibilidad de algún error en el programa.

#### Discrepancia con el modelo SIR ####
El modelo [SIR](https://es.wikipedia.org/wiki/Modelo_SIR) es un modelo epidemiológico conmunmente usado para entender la transmision de una enfermedad infecciosa. Con esta simulación, aunque el resultado es muy similar, se notan algunas diferencias. Una de las mas importantes es:
##### Influencia por distribución #####
En el model SIR, es como si cualquier infectado tuviese un acceso a cualquier otro posible candidato a infección. Muy similar a una infección con un punto central, y que se propaga radialmente, de forma que la infección tiene acceso a un número cada vez mayor de victimas (imaginar la superficie de un globo inchandose). O simplemente todos los individuos moviendose por todos los sitios posibles.
En la realida, pongamos un caso límite: Tenemos una ciudad **lineal** , en la que cada familia solo tiene contacto con 2 vecinos (anterior y posterior). Si el contagio empieza en un extremo, entonces en este caso la propagación solo puede ser lineal, nunca crecera exponencialmente, ya que por muy contagiosa que sea solo se contagiará al vecino cercano, y este al siguiente en un momento posterior. No se puede modelizar esto con el modelo SIR con ningun parámetro.

Cuando la población no está uniformemente distribuida, es facil ver como se producen crecimientos muy grandes cuando se alcanza una zona de mayor densidad de población, luego parece decaer (cuando la mayor parte del grupo se contagió), para mantenerse en un pequeño nivel de contagio hasta que se alcanza otro grupo. Quizas una forma de ver esto podría ser usando una combinación de modelos SIR, suma de varios para cada grupo poblacional.

#### Reinfecciones ####
Ocurre cuando un individuo no gana inmunidad y es posible que se vuelva a reinfectar.

#### Inmunidad de rebaño ####
Parece que si ningún otro factor cambia(como el propio virus con el clima), no se consigue inmunidad de rebaño hasta que no se supere el 50% de gente inmune.

---
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.0.5.


