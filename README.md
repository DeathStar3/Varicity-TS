# Symfinder

## Technical Requirements

- Docker
    - Instructions to install Docker are available [here](https://docs.docker.com/get-docker/).
- Docker Compose
    - Instructions to install Docker Compose are available [here](https://docs.docker.com/compose/install/#install-compose).

**Note:** You need to have a system running on either 
- GNU/Linux
- Windows 10 64bit: Pro, Enterprise or Education (Build 15063 or later)
- macOS Sierra 10.12 or newer on a hardware from at least 2010

**Note:** If you run symfinder on a Windows system, symfinder must be placed somewhere on your `C:` drive.

If your system does not match any of the requirements above, you must install a virtual machine.
[This tutorial](https://www.wikihow.com/Install-Ubuntu-on-VirtualBox) may help you.

**Note:** By default, on a GNU/Linux host, Docker commands must be run using `sudo`. Two options are available for you in order to run symfinder:
- Follow [these short steps](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user) to allow your user to call Docker commands,
- Preface the scripts calls with `sudo`.

## Getting Symfinder

1. Open a terminal and clone the repository by running:

    ```bash
    git clone https://github.com/DeathStar3/symfinder
    ```

2. Move in the project directory

    ```bash
    cd symfinder
    ```


## Reproducing the experiments

Run the analyses by running


- On GNU/Linux and macOS

    ```bash
    ./run.sh
    ```

- On Windows

    ```batch
    run.bat
    ```

This command will analyse the following projects:
- [Java AWT 8u202-b1532](https://github.com/JetBrains/jdk8u_jdk/tree/jb8u202-b1532/src/share/classes/java/awt)
- [Apache CXF 3.2.7](https://github.com/apache/cxf/tree/cxf-3.2.7/core/src/main/java/org/apache/cxf)
- [JUnit 4.12](https://github.com/junit-team/junit4/tree/r4.12/src/main/java)
- [Apache Maven 3.6.0](https://github.com/apache/maven/tree/maven-3.6.0)
- [JHipster 2.0.28](https://github.com/jhipster/jhipster/tree/2.0.28/jhipster-framework/src/main/java)
- [JFreeChart 1.5.0](https://github.com/jfree/jfreechart/tree/v1.5.0/src/main/java/org/jfree)
- [JavaGeom](https://github.com/dlegland/javaGeom/tree/7e5ee60ea9febe2acbadb75557d9659d7fafdd28/src)
- [ArgoUML](https://github.com/marcusvnac/argouml-spl/tree/bcae37308b13b7ee62da0867a77d21a0141a0f18/src)
- [Jackson Core](https://github.com/FasterXML/jackson-core/tree/jackson-core-2.10.1/src/main/java/)
- [ZXing](https://github.com/zxing/zxing/tree/zxing-3.4.0/core/src/main/java/)
- [Mockito](https://github.com/mockito/mockito/tree/v3.1.12/src/main/java/)
- [DeepLearning4j](https://github.com/eclipse/deeplearning4j/tree/deeplearning4j-1.0.0-beta5/deeplearning4j/)
- [RxJava](https://github.com/ReactiveX/RxJava/tree/v2.2.15/src/main/java/)
- [Guava](https://github.com/google/guava/tree/v28.1/guava/src/com/google/common)
- [Elasticsearch](https://github.com/elastic/elasticsearch/tree/v6.8.5/server/src/)

You can specify the projects you want to run by passing their names as parameters of the running script, for example

```bash
./run.sh junit
```

More details about the analysed projects and their definition are given in the [Using Symfinder on your project](#using-symfinder-on-your-project) section.

### Analysing the output data


Once the analyses are finished, run

- On GNU/Linux and macOS    

```bash
./visualization.sh
```

- On Windows

```bash
visualization.bat
```
Then, in your web browser, go to `http://localhost:8181`.
An index page will appear with the list of the analysed projects.
Click on the desired project to view its visualization.

Here is an example of visualization window:

![visualization.png](readme_files/visualization.png)

The window is made of several parts:

- ①: The top bar contains four buttons:
	- By clicking on the `Hide project information` button, you can hide the parts ③ and ④ in order to be able to see the graph better.
	- The `Color packages` button display a tab similar to the part ③ where you can enter the name of a package or a class and a new color will be applied to the corresponding nodes.
	- The `Show legend` button displays a legend to help you read the visualization.
	- The `Display variants` button displays all the variants of variation points, including the ones not being variation points. Click again on the button to show only variation points.
- ②: Here you can see the name and tag/commit ID of the project corresponding to the visualization being viewed, as well as the commit corresponding to the version of Symfinder that generated the visualization.
- ③: In the `Package/class to filter` field, you can enter the name of a class or package that you want to filter on the visualization.
When a filter is added, it is added to the list below. The cross on the right of each filter allows you to remove it.
On the right of this field is a `Filter isolated nodes` button which, when activated, removes the nodes having no relationship from the visualization.
Click again on the button to unfilter them.
- ④: Displays metrics on the project concerning variation points and variants

## Using Symfinder on your project

### Symfinder configuration

The application's settings are set up using a YAML file, called `symfinder.yaml`, that must be at the root of the project.
Here is an example:

```yaml
neo4j:
  boltAddress: bolt://localhost:7687
  user: neo4j
  password: root

experiments_file: experiments.yaml
```

#### Neo4j parameters

- `boltAddress`: address where Neo4j's bolt driver is exposed
- `user`: username
- `password`: the password to access the database

#### Experiments

`experiments_file` corresponds to the path of a YAML file (relative to the `experiments` directory) containing the description of the different source codes you want to analyse. Here is an example:

```yaml
junit:
  repositoryUrl: https://github.com/junit-team/junit4
  sourcePackage: .
  tagIds:
    - r4.12
javaGeom:
  repositoryUrl: https://github.com/dlegland/javaGeom
  sourcePackage: src
  commitIds:
    - 7e5ee60ea9febe2acbadb75557d9659d7fafdd28
```


You can specify as many experiments as you want.
Each project is defined by different parameters:
- `repositoryUrl`: URL of the project's Git repository
- `sourcePackage`: relative path of the package containing the sources of the project to analyse. `.` corresponds to the root of the project to be analysed.
- `commitIds`: IDs of the commits to analyse
- `tagsIds`: IDs of the tags to analyse

For each experiment, you can mix different commits and different tags to checkout. For example, we could have :

```yaml
junit:
  repositoryUrl: https://github.com/junit-team/junit4
  sourcePackage: .
  tagIds:
    - r4.12
    - r4.11
  commitIds:
    - c3715204786394f461d94953de9a66a4cec684e9
```

## Building symfinder

**This step is only needed if you edited symfinder's source code.**

You can build symfinder's Docker images by running

```bash
./build.sh
```

Then, run symfinder using the local images that you just built.

```bash
./run.sh --local
```

# Varicity

## Running Varicity

Before using Varicity, make sure to copy the .json files produced by symfinder in the ```varicity/symfinder_files``` folder.

### With Docker

To build Varicity, go to the ```varicity``` folder at the root of the project and run ```./build.sh```. This will create a varicity docker image that you can use by running ```./varicity.sh```.

### Run locally

To run Varicity on your local machine, you first need to install [node](https://nodejs.org/en/). Then, go to the ```varicity``` folder at the root of the project and run ```npm install```, then ```npm start```.



## Using Varicity

To access the visualization once Varicity is running, you need to access ```localhost:9090``` via a web browser.

### Select a project

To select the project you want to visualize, head to to side menu and click on Project selection, then on the name of your symfinder file (if it does not appear in the list, make sure it is in the ```varicity/symfinder_files``` folder and rerun Varicity).![project selection](readme_files/varicity/Project_selection.png)

You have the choice between the Metricity view or the Evostreet view. The Metricity view works, but has been abandoned to focus on the Evostreet visualization, thus it is considered legacy and not exploitable.

When you click on the Evostreet view, you will most probably have to wait for a few seconds while the file is getting parsed before the visualization actually appears on your screen.

### Exploring your city

Once the visualization is up, you can explore the city by moving the camera with the following controls:

- Left mouse button: Drag to turn the camera
- Right mouse button: Drag to move the camera
- Scroll up/down: Zoom in/out

You can use the search bar at the top of the side menu to search for a specific class and focus the camera on its corresponding building in the visualization (with autocompletion).

#### Buildings

Buildings represent classes and wear information with how they are displayed:

- Size:
  - Height: by default, the height of a building depends on the number of method variants of the class.
  - Width: by default, the width of a building depends on the number of constructor variants of the class.
- Color: the color of a building depends on the tags of its corresponding class (see the config section)
- Models: Some building may have additional features to their 3D model:
  - Design patterns:
    - Chimneys:  A building with chimneys represents a Factory class  
      ![factory](readme_files/varicity/Factory.png)
    - Dome: A building with a dome represents a Strategy class  
      ![strategy](readme_files/varicity/Strategy.png)
    - Inverted pyramid: A building with an inverted pyramid represents a Template class  
      ![template](readme_files/varicity/Template.png)
    - Sphere: A building with a sphere represents a Decorator class  
      ![decorator](readme_files/varicity/Decorator.png)
  - Pyramid and outline: The API classes have a pyramid and an outline added to their representation  
    ![api](readme_files/varicity/API.png)



#### Links

In Varicity, you can also see relations between your classes, in different ways:

- Roads: A road is created when a VP is parsed, and all its variants are displayed next to the road.
- Aerial links: By default, inheritance links (EXTENDS and IMPLEMENTS) are displayed as aerial links. The building at the darker side is the source (sub class), and the one at the brighter side is the destination (super class).  
  ![aerial link](readme_files/varicity/Aerial_link.png)
- Underground links: By default, an underground link between two buildings shows the DUPLICATE links, unique to Varicity and not present in the symfinder files. It means that the starting building is a variant of the target building, but could not be placed in the target's road because it had already been drawn. Thus, each building is displayed only once.  
  ![underground link](readme_files/varicity/Underground_link.png)



By clicking on a building, you can display the links leading to or coming from it, as well as detailed info on the side menu (types, attributes, links, etc.) in the "Object details" section.

![building selected](readme_files/varicity/Building_selected.png)



### Configuration

![config menu](readme_files/varicity/Configuration_menu.png)

In the side menu, you can change various configuration variables in the "Config parameters":

- Algorithmic config: These variables are used during the parsing algorithm, and thus will relaunch it, which may take a few moments:
  - Composition level: Change the level of composition use to display the city (default is 4).
  - Orientation: Can be IN, OUT, or IN_OUT. Used to change the orientation of the links used to establish the composition level of each element.
  - hierarchy_links: Contains the list of link types used to compose the graph of the city.
  - api_classes: List of names of the API classes used as starting points to build the city.
- Esthetic config: These variables only change some display features and will not relaunch the parsing algorithm:
  - Building:
    - padding: Will change the space between each building
    - colors:
      - faces: Contains the Colors list in which the buildings should be displayed according to their tags. Every Colors list in the configuration is ordered, and if a class has two of the listed tags, the first one in the list will be taken into account. Putting a ```!```before a tag name will set the color for each class that does not have the tag.
        Example (default config): 
        ![colors list](readme_files/varicity/Colors_list.png)
      - edges: Colors list for the outlines of the buildings (by default, there is only a black outline for the API classes).
      - outlines: Deprecated
  - district:
    - padding: Space between every district (default is 0)
    - colors > faces: Colors list for the types of package (tag PACKAGE is for the main road, tag VP is for the other roads).
  - link:
    - colors: Colors list for the links.
    - display:
      - air_traffic: List of tags corresponding to the links that should be displayed as aerial links.
      - underground_road: List of tags corresponding to the links that should be displayed as underground links.
  - blacklist: Each class or package in this list will be excluded from visualization.
  - variables: Names of the variables used to determine the height and the width of the buildings (do not change unless you know the variable names in the source code).

The default configuration is retrieved from the ```config/config.yaml``` file in the ```varicity ``` folder, which you can modify at any time (you will need to rerun Varicity to take the changes into account). An additional attribute in this file is "default_level", used to determine the default composition level (currently 4).

