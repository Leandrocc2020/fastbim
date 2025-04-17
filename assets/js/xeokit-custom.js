function MainModel(models, bimSdkModule) {

    // --------------------------------
    //  Variables and constants
    // --------------------------------

    let self = this;
    let Viewer = bimSdkModule.Viewer;
    let NavCubePlugin = bimSdkModule.NavCubePlugin
    let XKTLoaderPlugin = bimSdkModule.XKTLoaderPlugin;
    let WebIFCLoaderPlugin = bimSdkModule.WebIFCLoaderPlugin;
    let TreeViewPlugin = bimSdkModule.TreeViewPlugin;
    let ContextMenu = bimSdkModule.ContextMenu;
    let LocaleService = bimSdkModule.LocaleService;
    let SectionPlanesPlugin = bimSdkModule.SectionPlanesPlugin;
    let StoreyViewsPlugin = bimSdkModule.StoreyViewsPlugin;
    let BCFViewpointsPlugin = bimSdkModule.BCFViewpointsPlugin;
    let DistanceMeasurementsPlugin = bimSdkModule.DistanceMeasurementsPlugin;
    let AnnotationsPlugin = bimSdkModule.AnnotationsPlugin;
    //let Marker = bimSdkModule.Marker;
    //let math = bimSdkModule.math;

    self.Models = models;
    self.CUSTOM_VIEWER = null;
    self.CUSTOM_NAV_CUBE_PLUGIN = null;
    self.TREE_VIEW_PLUGIN = null;
    self.TREE_VIEW_CONTEXT_MENU = null;
    self.SECTION_PLANES_PLUGIN = null;
    self.DISTANCE_MEASUREMENTS = null;
    self.DISTANCE_MEASUREMENTS_CONTEXT_MENU = null;
    self.XKT_LOADER_PLUTGIN = null;
    self.CANVAS_CONTEXT_MENU = null;
    self.OBJECT_CONTEXT_MENU = null;
    self.ANNOTATION_PLUGIN = null;
    self._ActiveObject = false;
    self._selectedModel = null;
    self._modelsAlreadyLoadedCount = 0;
    self._modelsArrayLength = 0;
    self._isInfullScreen = false;
    self._allFilterOptions = [];
    self._PropertiesFilterDatatable = [];
    self._ObjectsToSetVisibleArray = [];
    self._AllObjectMetaDataCache = null;
    self._metroArray = [
        'Length', 'Comprimento', 'Width', 'Largura', 'Height', 'Altura',
        'Espessura', 'Thickness', 'Diameter', 'Diâmetro', 'Radius', 'Raio',
        'Perimeter', 'Perímetro', 'Elevation', 'Elevação', 'Displacement', 'Deslocamento'
    ];
    self._metroQuadradoArray = ['Area', 'Área'];
    self._metroCubicoArray = ['Volume'];
    self.IdObra = _idObra;
    self.IdUsuario = _idUsuario;
    self.VisibilidadeEnum = {
        ApenasParaMim: 1,
        Compartilhado: 2
    };
    self.AlterarColunasObject = {
        LastAlterarColunasId: null,
        GroupByObject: null,
        DatatableColumns: null
    };
    self._chaveCompartilhamentoNaoEncontrada = _chaveCompartilhamentoNaoEncontrada;
    self._trazerVistaSelecionada = _trazerVistaSelecionada;
    self._idVistaSelecionadaPadrao = _idVistaSelecionadaPadrao;
    self._userActions = _userActions;
    self.RightClickLastCoords = null;
    self.SetRightClickLastCoords = function (value) {
        self.RightClickLastCoords = value;
    };
    self.TemplateCriacaoTarefasHtml = null;
    self._IdsPlantasProcessadas = [];
    self.DropZoneConfiguration = {
        MaxFilesizeInMegaBytes: 10, // Tamanho máximo por arquivo (em MB)
        AcceptedFiles: "image/*", // Apenas imagens
        AddRemoveLinks: false // Não exibir links de remoção do Dropzone
    };
    self.DropzoneStates = {};

    // --------------------------------
    //  Initializer
    // --------------------------------

    self.InitializeBimViewer = async function () {

        try {
            //if (!_tokenValid) {
            //    window.top.location.href = _redirectURL;
            //    return;
            //}

            // Step 1
            self.GetAndConfigureViewer();
            self.EnableEventsForViewer(self.CUSTOM_VIEWER);

            // Step 2
            self.GetNavCubePlugin(self.CUSTOM_VIEWER);

            // Step 3
            self.GetTreeViewPlugin(self.CUSTOM_VIEWER);
            self.GetTreeViewContextMenu();
            self.EnableEventsForTreeView(self.TREE_VIEW_PLUGIN, self.TREE_VIEW_CONTEXT_MENU, self.CUSTOM_VIEWER);

            // Step 4
            self.GetSectionPlanesPlugin(self.CUSTOM_VIEWER);
            
            // Step 5
            self.GetDistanceMeasurementsPlugin(self.CUSTOM_VIEWER);
            self.GetDistanceMeasurementsContextMenu();
            self.EnableEventsForDistanceMeasurementsPlugin(self.DISTANCE_MEASUREMENTS, self.DISTANCE_MEASUREMENTS_CONTEXT_MENU, self.CUSTOM_VIEWER);

            // Step 6
            self.EnableEventsForDistanceMeasurementsContextMenu(self.DISTANCE_MEASUREMENTS_CONTEXT_MENU);

            // Step 7
            self.GetXktLoaderPlugin(self.CUSTOM_VIEWER);

            // Step 8
            self.GetCanvasContextMenu(self.CUSTOM_VIEWER);

            // Step 9
            self.GetObjectContextMenu(self.CUSTOM_VIEWER);
            self.EnableEventsForObjectContextMenu(self.CUSTOM_VIEWER, self.TREE_VIEW_PLUGIN, self.CANVAS_CONTEXT_MENU, self.OBJECT_CONTEXT_MENU);
           
            // Step 10
            // await self.GetAnnotationPlugin(self.CUSTOM_VIEWER);

            // Step 11
            self.EnableGeneralEventsForView(self.DISTANCE_MEASUREMENTS, self.SECTION_PLANES_PLUGIN, self.CUSTOM_VIEWER, self.TREE_VIEW_PLUGIN);

            // Step 12
            self.ProccessModels(self.Models, self.XKT_LOADER_PLUTGIN, self.TREE_VIEW_PLUGIN, self.CUSTOM_VIEWER);


        }
        catch (err) {
            var responseBase = {
                Success: false,
                Message: "InitializeBimViewer - General Error - " + err.message
            };
            self.HideLoader();
            self.HandleError(responseBase);
        }
    };

    // --------------------------------
    //  Initializer steps
    // --------------------------------

    self.GetAndConfigureViewer = function () {

        if (!self.CUSTOM_VIEWER) {

            self.CUSTOM_VIEWER = new Viewer({
                canvasId: "myCanvas",
                transparent: true,
                localeService: new LocaleService({
                    messages: {
                        "ptBR": { // PT-BR
                            "NavCube": {
                                "front": "Frente",
                                "back": "Fundo",
                                "top": "Topo",
                                "bottom": "Base",
                                "left": "Esquerda",
                                "right": "Direita"
                            }
                        },
                    },
                    locale: "ptBR"
                })
            });

            self.SetViewerDefaultConfiguration(self.CUSTOM_VIEWER);

        }

        return self.CUSTOM_VIEWER;

    };

    self.EnableEventsForViewer = function (viewer) {

        viewer.cameraControl.on("picked", (e) => {
            const entity = e.entity;

            viewer.scene.setObjectsSelected(viewer.scene.selectedObjectIds, false);

            if (viewer.scene.xrayedObjectIds.length > 0) {
                viewer.scene.setObjectsXRayed(viewer.scene.objectIds, true);
            }

            if (entity) {
                viewer.scene.setObjectsXRayed([entity.id], false);
                viewer.scene.setObjectsSelected([entity.id], true);
                self._ActiveObject = entity.id;
                self.RenderDetails(self._ActiveObject);
            }
        });

        let lastEntity = null;
        viewer.scene.input.on("mousemove", function (coords) {
            const hit = viewer.scene.pick({
                canvasPos: coords
            });
            if (hit) {
                if (!lastEntity || hit.entity.id !== lastEntity.id) {
                    if (lastEntity) {
                        lastEntity.selected = false;
                    }

                    lastEntity = hit.entity;
                    hit.entity.selected = true;
                }
            } else {
                if (lastEntity) {
                    lastEntity.selected = false;
                    lastEntity = null;
                }
            }
        });

    };

    self.SetViewerDefaultConfiguration = function (viewer) {

        viewer.scene.xrayMaterial.fill = true;
        viewer.scene.xrayMaterial.fillAlpha = 0.1;
        viewer.scene.xrayMaterial.fillColor = [0, 0, 0];
        viewer.scene.xrayMaterial.edgeAlpha = 0.3;
        viewer.scene.xrayMaterial.edgeColor = [0, 0, 0];

        viewer.scene.highlightMaterial.fill = true;
        viewer.scene.highlightMaterial.edges = true;
        viewer.scene.highlightMaterial.fillAlpha = 0.1;
        viewer.scene.highlightMaterial.edgeAlpha = 0.1;
        viewer.scene.highlightMaterial.edgeColor = [1, 1, 0];

        viewer.scene.selectedMaterial.fill = true;
        viewer.scene.selectedMaterial.edges = true;
        viewer.scene.selectedMaterial.fillAlpha = 0.5;
        viewer.scene.selectedMaterial.edgeAlpha = 0.6;
        viewer.scene.selectedMaterial.edgeColor = [0, 1, 1];

        viewer.camera.eye = [-3.933, 2.855, 27.018];
        viewer.camera.look = [4.400, 3.724, 8.899];
        viewer.camera.up = [-0.018, 0.999, 0.039];

    }

    self.GetNavCubePlugin = function (viewer) {

        if (!self.CUSTOM_NAV_CUBE_PLUGIN) {
            self.CUSTOM_NAV_CUBE_PLUGIN = new NavCubePlugin(viewer, {
                canvasId: "myNavCubeCanvas",
                color: "white",
                visible: true,
                cameraFly: true,
                cameraFitFOV: 45,
                cameraFlyDuration: 0.5,
                shadowVisible: false,
            });
        }

        return self.CUSTOM_NAV_CUBE_PLUGIN;
    };

    self.GetTreeViewPlugin = function (viewer) {

        if (!self.TREE_VIEW_PLUGIN) {
            self.TREE_VIEW_PLUGIN = new TreeViewPlugin(viewer, {
                containerElement: document.getElementById("treeViewer"),
                hierarchy: "storeys",
                autoExpandDepth: 0,
                sortNodes: false,
                autoAddModels: false,
            });
        }

        return self.TREE_VIEW_PLUGIN;
    };

    self.GetTreeViewContextMenu = function () {

        if (!self.TREE_VIEW_CONTEXT_MENU) {
            self.TREE_VIEW_CONTEXT_MENU = new ContextMenu({
                items: [
                    [
                        {
                            title: "Centralizar",
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                const objectIds = [];
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        objectIds.push(treeViewNode.objectId);
                                    }
                                });
                                scene.setObjectsVisible(objectIds, true);
                                scene.setObjectsHighlighted(objectIds, true);
                                context.viewer.cameraFlight.flyTo({
                                    projection: "perspective",
                                    aabb: scene.getAABB(objectIds),
                                    duration: 0.5
                                }, () => {
                                    setTimeout(function () {
                                        scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                                    }, 500);
                                });
                            }
                        },
                        {
                            title: "Centralizar tudo",
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                context.viewer.cameraFlight.flyTo({
                                    projection: "perspective",
                                    aabb: scene.getAABB({}),
                                    duration: 0.5
                                });
                            }
                        }
                    ],
                    [
                        {
                            title: "Esconder",
                            doAction: function (context) {
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                        if (entity) {
                                            entity.visible = false;
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title: "Esconder outros",
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsVisible(scene.visibleObjectIds, false);
                                scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                                scene.setObjectsSelected(scene.selectedObjectIds, false);
                                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        const entity = scene.objects[treeViewNode.objectId];
                                        if (entity) {
                                            entity.visible = true;
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title: "Esconder tudo",
                            getEnabled: function (context) {
                                return (context.viewer.scene.visibleObjectIds.length > 0);
                            },
                            doAction: function (context) {
                                context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
                            }
                        }
                    ],
                    [
                        {
                            title: "Mostrar",
                            doAction: function (context) {
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                        if (entity) {
                                            entity.visible = true;
                                            entity.xrayed = false;
                                            entity.selected = false;
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title: "Mostrar outros",
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsVisible(scene.objectIds, true);
                                scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                                scene.setObjectsSelected(scene.selectedObjectIds, false);
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        const entity = scene.objects[treeViewNode.objectId];
                                        if (entity) {
                                            entity.visible = false;
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title: "Mostrar tudo",
                            getEnabled: function (context) {
                                const scene = context.viewer.scene;
                                return (scene.numVisibleObjects < scene.numObjects);
                            },
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsVisible(scene.objectIds, true);
                                scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                                scene.setObjectsSelected(scene.selectedObjectIds, false);
                            }
                        }
                    ],
                    [
                        {
                            title: "Raio-X",
                            doAction: function (context) {
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                        if (entity) {
                                            entity.xrayed = true;
                                            entity.visible = true;
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title: "Desfazer Raio-X",
                            doAction: function (context) {
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                        if (entity) {
                                            entity.xrayed = false;
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title: "Raio-X outros",
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsVisible(scene.objectIds, true);
                                scene.setObjectsXRayed(scene.objectIds, true);
                                scene.setObjectsSelected(scene.selectedObjectIds, false);
                                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        const entity = scene.objects[treeViewNode.objectId];
                                        if (entity) {
                                            entity.xrayed = false;
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title: "Resetar Raio-X",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numXRayedObjects > 0);
                            },
                            doAction: function (context) {
                                context.viewer.scene.setObjectsXRayed(context.viewer.scene.xrayedObjectIds, false);
                            }
                        }
                    ],
                    [
                        {
                            title: "Selecionar",
                            doAction: function (context) {
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                        if (entity) {
                                            entity.selected = true;
                                            entity.visible = true;
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title: "Remover seleção",
                            doAction: function (context) {
                                context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                                    if (treeViewNode.objectId) {
                                        const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                        if (entity) {
                                            entity.selected = false;
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title: "Limpar seleção",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numSelectedObjects > 0);
                            },
                            doAction: function (context) {
                                context.viewer.scene.setObjectsSelected(context.viewer.scene.selectedObjectIds, false);
                            }
                        }
                    ]
                ]
            });
        }

        return self.TREE_VIEW_CONTEXT_MENU;
    }

    self.ComportamentoPadraoTreeViewerNodeTitleClicked = function (e) {
        self._ActiveObject = e.treeViewNode.objectId;
        self.RenderDetails(self._ActiveObject);
        const scene = viewer.scene;
        const objectIds = [];

        let depth = 0;

        let parent = e.treeViewNode.parent;

        while (parent) {
            depth++;
            parent = parent.parent;
        }

        e.treeViewPlugin.withNodeTree(e.treeViewNode, (treeViewNode) => {
            if (treeViewNode.objectId) {
                objectIds.push(treeViewNode.objectId);
            }
        });

        e.treeViewPlugin.unShowNode();

        const activeTreeView = document.querySelector('[data-toggle="treeview"].active')
        scene.setObjectsSelected(scene.objectIds, false);
        
        if (activeTreeView.dataset.hierarchy == 'containment') {
            scene.setObjectsXRayed(scene.objectIds, false);
            scene.setObjectsVisible(scene.objectIds, false);
        }
        else if (activeTreeView.dataset.hierarchy == 'types') {
            scene.setObjectsXRayed(scene.objectIds, false);
            scene.setObjectsVisible(scene.objectIds, false);
        } 
        else if (activeTreeView.dataset.hierarchy == 'storeys') {
            scene.setObjectsXRayed(scene.objectIds, false);
            scene.setObjectsVisible(scene.objectIds, false);
        }
        else if (activeTreeView.dataset.hierarchy != 'storeys' || depth > 1) {
            if (depth > 1 && depth < 3) {
                scene.setObjectsSelected(objectIds, true);
            }
        }
        else {
            scene.setObjectsXRayed(scene.objectIds, false);
            scene.setObjectsVisible(scene.objectIds, false);
        }

        scene.setObjectsVisible(objectIds, true);
        scene.setObjectsXRayed(objectIds, false);

        viewer.cameraFlight.flyTo({
            aabb: scene.getAABB(objectIds),
            duration: 0.5
        });
    };

    self.ShowAllTasks = function () {
        $(`[data-idplanta-on-marker-label]`).each(function () {
            var idPlanta = $(this).data("idplanta-on-marker-label");
            self.ShowTasksFromIdPlanta(idPlanta);
        });
    };

    self.HideAllTasks = function () {
        $(`[data-idplanta-on-marker-label]`).each(function () {
            var element = $(this);
            var markMapper = $(element).prev(".annotation-marker");
            $(markMapper).hide();
        });
    };

    self.ShowTasksFromIdPlanta = function (idPlanta) {
        $(`[data-idplanta-on-marker-label="${idPlanta}"]`).each(function () {
            var element = $(this);
            var markMapper = $(element).prev(".annotation-marker");
            $(markMapper).show();
        });
    };

    self.ShowTasksFromIdTarefa = function (idTarefa) {
        $(`#task_${idTarefa}`).each(function () {
            var element = $(this);
            var markMapper = $(element).prev(".annotation-marker");
            $(markMapper).show();
        });
    };

    self.EnableEventsForTreeView = function (treeView, treeViewContextMenu, viewer) {

        treeView.on("contextmenu", (e) => {
            treeViewContextMenu.context = { // Must set context before opening menu
                viewer: e.viewer,
                treeViewPlugin: e.treeViewPlugin,
                treeViewNode: e.treeViewNode,
                entity: e.viewer.scene.objects[e.treeViewNode.objectId] // Only defined if tree node is a leaf node
            };

            treeViewContextMenu.show(e.event.pageX, e.event.pageY);
        });

        treeView.on("nodeTitleClicked", (e) => {
            self.ComportamentoPadraoTreeViewerNodeTitleClicked(e);
            
            var idPlanta = $(e.event.target).parent().data('idplanta');
            var nodeId = e.treeViewNode.nodeId;
            var attrChecked = $(`#${nodeId}`).is(':checked');
            self.HideAllTasks();
            self.ShowTasksFromIdPlanta(idPlanta);
        });
       
    };

    self.GetSectionPlanesPlugin = function (viewer) {

        if (!self.SECTION_PLANES_PLUGIN) {
            self.SECTION_PLANES_PLUGIN = new SectionPlanesPlugin(viewer, {
                overviewCanvasId: "mySectionPlanesOverviewCanvas",
                overviewVisible: true
            });
        }

        return self.SECTION_PLANES_PLUGIN;
    };

    self.GetDistanceMeasurementsPlugin = function (viewer) {

        if (!self.DISTANCE_MEASUREMENTS) {
            self.DISTANCE_MEASUREMENTS = new DistanceMeasurementsPlugin(viewer, {});
        }

        return self.DISTANCE_MEASUREMENTS;
    };

    self.EnableEventsForDistanceMeasurementsPlugin = function (distanceMeasurements, distanceMeasurementsContextMenu, viewer) {

        distanceMeasurements.on("mouseOver", (e) => {
            e.distanceMeasurement.setHighlighted(true);
        });

        distanceMeasurements.on("mouseLeave", (e) => {
            if (distanceMeasurementsContextMenu.show && distanceMeasurementsContextMenu.context && distanceMeasurementsContextMenu.context.distanceMeasurement.id === e.distanceMeasurement.id) {
                return;
            }
            e.distanceMeasurement.setHighlighted(false);
        });

        distanceMeasurements.on("contextMenu", (e) => {
            distanceMeasurementsContextMenu.context = { // Must set context before showing menu
                viewer: viewer,
                distanceMeasurementsPlugin: distanceMeasurements,
                distanceMeasurement: e.distanceMeasurement
            };
            distanceMeasurementsContextMenu.show(e.event.clientX, e.event.clientY);
            e.event.preventDefault();
        });
    };

    self.GetDistanceMeasurementsContextMenu = function () {
        if (!self.DISTANCE_MEASUREMENTS_CONTEXT_MENU) {

            self.DISTANCE_MEASUREMENTS_CONTEXT_MENU = new ContextMenu({
                items: [
                    [
                        {
                            title: "Remover medida",
                            doAction: function (context) {
                                context.distanceMeasurement.destroy();
                            }
                        },
                        {
                            getTitle: (context) => {
                                return context.distanceMeasurement.axisVisible ? "Esconder eixo" : "Mostrar eixo";
                            },
                            doAction: function (context) {
                                context.distanceMeasurement.axisVisible = !context.distanceMeasurement.axisVisible;
                            }
                        },
                        {
                            getTitle: (context) => {
                                return context.distanceMeasurement.labelsVisible ? "Esconder Números" : "Mostrar Números";
                            },
                            doAction: function (context) {
                                context.distanceMeasurement.labelsVisible = !context.distanceMeasurement.labelsVisible;
                            }
                        }
                    ], [
                        {
                            title: "Limpar tudo",
                            getEnabled: function (context) {
                                return (Object.keys(context.distanceMeasurementsPlugin.measurements).length > 0);
                            },
                            doAction: function (context) {
                                context.distanceMeasurementsPlugin.clear();
                            }
                        }
                    ]
                ]
            });

        }

        return self.DISTANCE_MEASUREMENTS_CONTEXT_MENU;
    };

    self.EnableEventsForDistanceMeasurementsContextMenu = function (distanceMeasurementsContextMenu) {
        distanceMeasurementsContextMenu.on("hidden", () => {
            if (distanceMeasurementsContextMenu.context.distanceMeasurement) {
                distanceMeasurementsContextMenu.context.distanceMeasurement.setHighlighted(false);
            }
        });
    };

    self.GetXktLoaderPlugin = function (viewer) {
        if (!self.XKT_LOADER_PLUTGIN) {
            self.XKT_LOADER_PLUTGIN = new XKTLoaderPlugin(viewer, {
                reuseGeometries: false,
            });
        }

        return self.XKT_LOADER_PLUTGIN;
    };

    self.GetCanvasContextMenu = function (viewer) {

        if (!self.CANVAS_CONTEXT_MENU) {

            self.CANVAS_CONTEXT_MENU = new ContextMenu({
                enabled: true,
                context: {
                    viewer: viewer
                },
                items: [
                    [
                        {
                            title: "Esconder selecionados",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numSelectedObjects > 0);
                            },
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsVisible(scene.selectedObjectIds, false);
                            }
                        },
                        {
                            title: "Esconder tudo",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numVisibleObjects > 0);
                            },
                            doAction: function (context) {
                                context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
                            }
                        },
                    ],
                    [
                        {
                            title: "Raio-X em selecionados",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numSelectedObjects > 0);
                            },
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsXRayed(scene.selectedObjectIds, true);
                            }
                        },
                        {
                            title: "Raio-X em tudo",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numVisibleObjects > 0);
                            },
                            doAction: function (context) {
                                context.viewer.scene.setObjectsXRayed(context.viewer.scene.visibleObjectIds, true);
                            }
                        },
                        {
                            title: "Desfazer Raio-X",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numXRayedObjects > 0);
                            },
                            doAction: function (context) {
                                context.viewer.scene.setObjectsXRayed(context.viewer.scene.xrayedObjectIds, false);
                            }
                        },
                    ],
                    [
                        {
                            title: "Limpar Seleção",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numSelectedObjects > 0);
                            },
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsSelected(scene.selectedObjectIds, false);
                            }
                        },
                    ],
                    [
                        {
                            title: "Mostrar tudo",
                            getEnabled: function (context) {
                                const scene = context.viewer.scene;
                                return (scene.numVisibleObjects < scene.numObjects);
                            },
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsVisible(scene.objectIds, true);
                                scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                                scene.setObjectsSelected(scene.selectedObjectIds, false);
                            }
                        },
                        {
                            title: "Mostrar selecionados",
                            getEnabled: function (context) {
                                const scene = context.viewer.scene;
                                return scene.numSelectedObjects > 0;
                            },
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsVisible(scene.objectIds, false);
                                scene.setObjectsVisible(scene.selectedObjectIds, true);
                                scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                                scene.setObjectsSelected(scene.selectedObjectIds, false);
                            }
                        }
                    ],
                    [
                        {
                            title: "Centralizar tudo",
                            doAction: function (context) {
                                context.viewer.cameraFlight.flyTo({
                                    aabb: context.viewer.scene.getAABB()
                                });
                            }
                        }
                    ]
                ]
            });
        }

        return self.CANVAS_CONTEXT_MENU;

    };

    self.ArrayTeste = [];
    self.GenerateUniqueTaksId = function () {
        var currentDate = new Date();
        var uniqueString = currentDate.toJSON() + currentDate.getMilliseconds();
        return 'task_' + CryptoJS.MD5(uniqueString).toString();
    };

    self.GetObjectContextMenu = function () {

        if (!self.OBJECT_CONTEXT_MENU) {

            self.OBJECT_CONTEXT_MENU = new ContextMenu({
                items: [
                    [
                        {
                            title: "Criar tarefa nesse elemento",
                            doAction: function (context) {
                                debugger
                                if (!self._userActions.CanCreateTasks) {
                                    self.ShowWarningAlert("Seu perfil não tem permissão de criar tarefas");
                                    return false;
                                }

                                var id = self.GenerateUniqueTaksId();
                                var entity = context.entity;

                                self.HideAllTasks();
                                self.CreateAnnotationTemplateCriacao(id, entity);
                                self.ShowTasksFromIdTarefa(id);
                            },
                            getEnabled: function (context) {
                                //if (!self._userActions)
                                //    return false;

                                //return self._userActions.CanCreateTasks;
                                return true;
                            },
                        },
                        {
                            title: "Centralizar",
                            doAction: function (context) {
                                const viewer = context.viewer;
                                const scene = viewer.scene;
                                const entity = context.entity;
                                viewer.cameraFlight.flyTo({
                                    aabb: entity.aabb,
                                    duration: 0.5
                                }, () => {
                                    setTimeout(function () {
                                        scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                                    }, 500);
                                });
                            }
                        },
                        {
                            title: "Centralizar tudo",
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                context.viewer.cameraFlight.flyTo({
                                    projection: "perspective",
                                    aabb: scene.getAABB(),
                                    duration: 0.5
                                });
                            }
                        },
                        {
                            title: "Mostrar na Árvore de elementos",
                            doAction: function (context) {
                                const objectId = context.entity.id;
                                document.querySelector('#tree_button').classList.add('active');
                                document.querySelector('#treeViewer').parentElement.classList.remove('hidden');
                                context.treeViewPlugin.showNode(objectId);
                                $('#bim-viewer').find("#treeViewer").scrollLeft(0);
                            }
                        }
                    ],
                    [
                        {
                            title: "Esconder",
                            getEnabled: function (context) {
                                return context.entity.visible;
                            },
                            doAction: function (context) {
                                context.entity.visible = false;
                            }
                        },
                        {
                            title: "Esconder outros",
                            doAction: function (context) {
                                const viewer = context.viewer;
                                const scene = viewer.scene;
                                const entity = context.entity;
                                const metaObject = viewer.metaScene.metaObjects[entity.id];
                                if (!metaObject) {
                                    return;
                                }
                                scene.setObjectsVisible(scene.visibleObjectIds, false);
                                scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                                scene.setObjectsSelected(scene.selectedObjectIds, false);
                                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                                metaObject.withMetaObjectsInSubtree((metaObject) => {
                                    const entity = scene.objects[metaObject.id];
                                    if (entity) {
                                        entity.visible = true;
                                    }
                                });
                            }
                        },
                        {
                            title: "Esconder tudo",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numVisibleObjects > 0);
                            },
                            doAction: function (context) {
                                context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
                            }
                        },
                        {
                            title: "Mostrar tudo",
                            getEnabled: function (context) {
                                const scene = context.viewer.scene;
                                return (scene.numVisibleObjects < scene.numObjects);
                            },
                            doAction: function (context) {
                                const scene = context.viewer.scene;
                                scene.setObjectsVisible(scene.objectIds, true);
                            }
                        }
                    ],
                    [
                        {
                            title: "Raio-X",
                            getEnabled: function (context) {
                                return (!context.entity.xrayed);
                            },
                            doAction: function (context) {
                                context.entity.xrayed = true;
                            }
                        },
                        {
                            title: "Desfazer Raio-X",
                            getEnabled: function (context) {
                                return context.entity.xrayed;
                            },
                            doAction: function (context) {
                                context.entity.xrayed = false;
                            }
                        },
                        {
                            title: "Raio-X outros",
                            doAction: function (context) {
                                const viewer = context.viewer;
                                const scene = viewer.scene;
                                const entity = context.entity;
                                const metaObject = viewer.metaScene.metaObjects[entity.id];
                                if (!metaObject) {
                                    return;
                                }
                                scene.setObjectsVisible(scene.objectIds, true);
                                scene.setObjectsXRayed(scene.objectIds, true);
                                scene.setObjectsSelected(scene.selectedObjectIds, false);
                                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                                metaObject.withMetaObjectsInSubtree((metaObject) => {
                                    const entity = scene.objects[metaObject.id];
                                    if (entity) {
                                        entity.xrayed = false;
                                    }
                                });
                            }
                        },
                        {
                            title: "Resetar Raio-X",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numXRayedObjects > 0);
                            },
                            doAction: function (context) {
                                context.viewer.scene.setObjectsXRayed(context.viewer.scene.xrayedObjectIds, false);
                            }
                        }
                    ],
                    [
                        {
                            title: "Selecionar",
                            getEnabled: function (context) {
                                return (!context.entity.selected);
                            },
                            doAction: function (context) {
                                console.log(context.entity);
                                context.entity.selected = true;
                            }
                        },
                        {
                            title: "Desfazer seleção",
                            getEnabled: function (context) {
                                return context.entity.selected;
                            },
                            doAction: function (context) {
                                context.entity.selected = false;
                            }
                        },
                        {
                            title: "Limpar seleção",
                            getEnabled: function (context) {
                                return (context.viewer.scene.numSelectedObjects > 0);
                            },
                            doAction: function (context) {
                                context.viewer.scene.setObjectsSelected(context.viewer.scene.selectedObjectIds, false);
                            }
                        }
                    ]
                ],
                enabled: true
            });
        }

        return self.OBJECT_CONTEXT_MENU;

    };

    self.IsPostDataValid = function (postData) {
        var tituloTarefa = postData.Titulo.trim();
        if (!tituloTarefa) {
            self.ShowWarningAlert('O título da tarefa precisa ser informado.')
            return false;
        } 
        
        var descricaoTarefa = postData.Descricao.trim();
        if (!descricaoTarefa) {
            self.ShowWarningAlert('A descrição da tarefa precisa ser informada.')
            return false;
        } 

        var prazoInicial = postData.PrazoInicial;
        var prazoFinal = postData.PrazoFinal;

        if (prazoInicial && prazoFinal) {
            var dataInicialString = self.ConvertToAmericanFormat(prazoInicial);
            var dataFinalString = self.ConvertToAmericanFormat(prazoFinal);

            if (!dataInicialString || !dataFinalString) {
                return false;
            }

            var dataInicial = new Date(dataInicialString);
            var dataFinal = new Date(dataFinalString);

            if (dataFinal < dataInicial) {
                self.ShowWarningAlert('A data final não pode ser menor que a data inicial.');
                return false;
            }
        }

        return true;
    };

    self.ChangeAnnotationKeyInsideAnnotationPlugin = function (oldKey, newKey) {
        try {
            if (!self.ANNOTATION_PLUGIN || !self.ANNOTATION_PLUGIN.annotations) {
                return false;
            }
            const annotations = self.ANNOTATION_PLUGIN.annotations;

            // Verifica se a oldKey existe
            if (!annotations[oldKey]) {
                return false;
            }

            // Verifica se a newKey já existe
            if (annotations[newKey]) {
                return false;
            }

            // Transfere diretamente o objeto para a nova chave
            annotations[newKey] = annotations[oldKey];

            // Atualiza a propriedade id no próprio objeto
            annotations[newKey].id = newKey;

            // Remove a chave antiga
            delete annotations[oldKey];

            return true;
        } catch (err) {
            return false;
        }
    };

    self.ReloadModalTarefasByPostResponseData = function (idTarefaHTML, tarefa, alertMessage, titulo) {
        if (tarefa) {
            var idNewTask = 'task_' + tarefa.Id;

            $(`#${idTarefaHTML} .header-section .annotation-title`).text('Editar tarefa');
            $(`#${idTarefaHTML} .content-section #IdTarefa`).val(idNewTask);
            $(`#${idTarefaHTML}`).attr("id", idNewTask);

            self.HideAnnotationLabelById(idNewTask);
            var opResult = self.ChangeAnnotationKeyInsideAnnotationPlugin(idTarefaHTML, idNewTask);
            if (!opResult) {
                // NUNCA NUNCA NUNCA vai entrar nesse erro. Entretanto, se entrar por qualquer cenário que não consegui prever ainda PRECISA recarregar a tela.
                // Se não recarregar acontece uma série de bugs em cadeia ao continuar criando tarefas por ter alterado as propriedades dentro do plugin.
                self.ShowWarningAlert("A tarefa foi criada com sucesso, entretanto, ocorreu um erro ao vincular no modelo IFC. A tela será recarregada automaticamente para correção. Se o erro persistir, por favor, reporte um issue");
                setTimeout(function () {
                    window.location.reload();
                }, 7000)
                return;
            }
            
            var markerElement = $(`#${idNewTask}`).prev(".annotation-marker")[0];
            self.ChangeSVGColor(markerElement, tarefa.CorWeb);
            self.SetTarefaPrivadaBadgeOnMarker(markerElement, tarefa.Privada);

            self.ShowSuccessToastMessage(`Tarefa ${alertMessage}!`, `A tarefa “${titulo}” já está no documento.`);
        };
    };

    self.SetTarefaPrivadaBadgeOnMarker = function (markerElement, isPrivada) {
        if (isPrivada && markerElement) {
            $(markerElement).append(self.GetPrivateTaskBadgeHtml());
        }
    }

    self.GetPrivateTaskBadgeHtml = function () {
        return `
            <div class="private-task-area">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.23999" y="0.5" width="13" height="13" rx="6.5" fill="#F3F3F3"/>
                    <path d="M5.53463 5.27734V6.01562H7.94535V5.27734C7.94535 4.59751 7.40595 4.04688 6.73999 4.04688C6.07403 4.04688 5.53463 4.59751 5.53463 5.27734ZM4.57035 6.01562V5.27734C4.57035 4.05457 5.54217 3.0625 6.73999 3.0625C7.93781 3.0625 8.90963 4.05457 8.90963 5.27734V6.01562H9.1507C9.68257 6.01562 10.115 6.45706 10.115 7V9.95312C10.115 10.4961 9.68257 10.9375 9.1507 10.9375H4.32928C3.79741 10.9375 3.36499 10.4961 3.36499 9.95312V7C3.36499 6.45706 3.79741 6.01562 4.32928 6.01562H4.57035Z" fill="#6F6F6F"/>
                </svg>
            </div>
        `;
    }

    self.RemoveAnexo = function (idTarefaHtml, fileName, tarefaAnexoId) {
        if (Number.isInteger(Number(idTarefaHtml))) {
            idTarefaHtml = "task_" + idTarefaHtml;
        }
        let element = $(`#${idTarefaHtml} .content-section form #file-list div[data-file-name="${fileName}"]`);

        if (element && element.length > 0) {
            var inputExclusao = $(`#${idTarefaHtml} .content-section form #IdAnexosExcluir`);
            var inputValue = (inputExclusao) ? $(inputExclusao).val() : null;
            if (inputValue) {
                inputValue += ', ' + tarefaAnexoId;
                $(inputExclusao).val(inputValue);
            } else {
                
                $(inputExclusao).val(tarefaAnexoId);
            }

            $(element).remove();
        }
    };

    self.CalculateFormDataSize = function (formData) {
        let totalSize = 0;

        for (let pair of formData.entries()) {
            const [key, value] = pair;
            if (value instanceof File) {
                totalSize += value.size;
            } else {
                totalSize += new TextEncoder().encode(value).length;
            }
            totalSize += new TextEncoder().encode(key).length;
        }

        return totalSize;
    }

    self.GetFormDataByPostObject = function (postData, dropZoneItem) {
        var formData = new FormData();

        for (let key in postData) {
            if (postData[key] !== null && postData[key] !== undefined) {
                formData.append(key, postData[key]);
            }
        }

        if (dropZoneItem && dropZoneItem.UploadedFileListHidden && dropZoneItem.UploadedFileListHidden.length > 0) {
            dropZoneItem.UploadedFileListHidden.forEach((file, i) => {
                var fileKey = `files[${i}]`;
                formData.append(fileKey, file);
            });
        }

        return formData;
    };

    self.PostCreateNewTask = async function (buttonHtmlElement, idTarefaHTML) {
        var id = $("#" + idTarefaHTML + " .content-section form #IdTarefa").val();
        if (id == 0) id = idTarefaHTML;
        if (!id.includes("task_"))
            id = "task_" + id;

        var isCriacao = id == 0 || (id && id.length > 30);
        var modalTitulo = isCriacao ? "Criar" : "Editar";
        var alertMessage = isCriacao ? "criada" : "editada";
        var idDocumento = $("#" + id + " .content-section form #IdDocumento").val();
        var titulo = $("#" + id + " .content-section form #tituloTarefa").val();
        var descricao = $("#" + id + " .content-section form #descricaoTarefa").val();
        var worldPosX = $("#" + id + " .content-section form #WorldPosX").val();
        var worldPosY = $("#" + id + " .content-section form #WorldPosY").val();
        var worldPosZ = $("#" + id + " .content-section form #WorldPosZ").val();
        var idStatus = $("#" + idTarefaHTML + " .content-section form .selectStatusTarefa").val(); 
        var isPrivada = $("#" + idTarefaHTML + " .content-section form #IsTarefaPrivada").is(":checked");
        var idResponsavel = $("#" + idTarefaHTML + " .content-section form .selectResponsavel").val();
        var idRelevancia = $("#" + idTarefaHTML + " .content-section form .selectRelevanciaTarefa").val();
        var idsDisciplinas = $("#" + idTarefaHTML + " .content-section form .selectDisciplinasTarefa").val();
        var idsParticipantes = $("#" + idTarefaHTML + " .content-section form .selectParticipantes").val();
        var idsLocais = $("#" + idTarefaHTML + " .content-section form .selectLocais").val();
        var prazoInicial = $("#" + idTarefaHTML + " .content-section form input[name='prazoInicial']").val();
        var prazoFinal = $("#" + idTarefaHTML + " .content-section form input[name='prazoFinal']").val();
        var idFase = $("#" + idTarefaHTML + " .content-section form #fase").val();
        var idCategoria = $("#" + idTarefaHTML + " .content-section form #idCategoria").val();
        var idsTags = $("#" + idTarefaHTML + " .content-section form .selectTags").val();
        var idsTags = $("#" + idTarefaHTML + " .content-section form .selectTags").val();
        var IdAnexosExcluir = $("#" + idTarefaHTML + " .content-section form #IdAnexosExcluir").val();
        if (prazoInicial) {
            prazoInicial = self.ConvertToAmericanFormat(prazoInicial);
        }

        if (prazoFinal) {
            prazoFinal = self.ConvertToAmericanFormat(prazoFinal);
        }

        var postData = {
            Id: isCriacao ? 0 : parseInt(id.split('task_').pop()),
            IdObra: self.IdObra,
            IdUsuario: self.IdUsuario,
            IdDocumento: idDocumento,
            Titulo: titulo,
            Descricao: descricao,
            LatitudeString: worldPosX,
            LongitudeString: worldPosY,
            PositionZString: worldPosZ,
            UserListParticipantes: idsParticipantes,
            Privada: isPrivada,
            IdResponsavel: idResponsavel,
            IdStatus: idStatus,
            PrazoInicialString: prazoInicial,
            PrazoFinalString: prazoFinal,
            IdFase: idFase,
            IdCategoria: idCategoria,
            IdsTags: idsTags ? idsTags.join(",") : "",
            IdsLocais: idsLocais ? idsLocais.join(",") : "",
            IdsDisciplinas: idsDisciplinas ? idsDisciplinas.join(",") : "",
            IdRelevancia: idRelevancia,
            AnexosExcluir: IdAnexosExcluir
        };
        
        // Obter o estado atual do dropZone
        var dropZoneItem = self.GetDropzoneState(id);

        // Gerar o FormData
        var formData = self.GetFormDataByPostObject(postData, dropZoneItem);

        // Validações
        if (!self.IsPostDataValid(Object.fromEntries(formData.entries()))) {
            return;
        }
        
        buttonHtmlElement.html('<i style="margin-right: 4px;" class="fas fa-circle-notch fa-spin"></i> Salvar');
        buttonHtmlElement.prop("disabled", true);
        buttonHtmlElement.addClass("loading");
        
        var url = '/Tarefa/PersistAsync?token=' + self.GetUrlToken();
        $.ajax({
            url: url,
            method: "POST",
            data: formData,
            processData: false, 
            contentType: false, 
            success: function (response) {
                
                if (response.Success == false) {
                    self.ShowErrorToastMessage('Erro ao ' + modalTitulo.toLowerCase() + ' a tarefa!', 'Tente novamente e se o erro continuar, por favor, reporte um issue');
                    return;
                }
                
                if (isCriacao) {
                    self.ReloadModalTarefasByPostResponseData(idTarefaHTML, response.Data, alertMessage, titulo);
                    self.ShowAllTasks();
                    return;
                }

                var tarefa = response.Data;
                var idNewTask = 'task_' + tarefa.Id;
                var markerElement = $(`#${idNewTask}`).prev(".annotation-marker")[0];
                self.ChangeSVGColor(markerElement, tarefa.CorWeb);
                self.SetTarefaPrivadaBadgeOnMarker(markerElement, tarefa.Privada);

                self.HideAnnotationLabelById(idTarefaHTML);
                self.ShowAllTasks();
                self.ShowSuccessToastMessage(`Tarefa ${alertMessage}!`, `A tarefa “${titulo}” já está no documento.`);
            },
            error: function () {
                self.ShowErrorAlert("Ocorreu um erro ao salvar as informações de tarefa. Por favor, tente novamente.");
            },
            complete: function () {
                buttonHtmlElement.html("Salvar");
                buttonHtmlElement.prop("disabled", false);
                buttonHtmlElement.removeClass("loading");
            }
        });
    };

    self.ConvertToAmericanFormat = function (dateString) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            self.ShowErrorToastMessage('Invalid Date', 'Expected format is dd/MM/yyyy or yyyy-MM-dd');
            return;
        }

        const [day, month, year] = dateString.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        if (isNaN(date.getTime())) {
            self.ShowErrorToastMessage('Invalid Date', 'Unable to parse the provided date');
            return;
        }

        const paddedDay = day.padStart(2, '0');
        const paddedMonth = month.padStart(2, '0');

        return `${year}-${paddedMonth}-${paddedDay}`;
    };

    self.PostDeleteTask = async function (button, idTarefa) {
        var postData = {
            idObra: self.IdObra,
            idTarefa: idTarefa
        }

        if (button) {
            button.html('<i style="color: #F45757;font-size: 14px;" class="fas fa-circle-notch fa-spin"></i>');
            button.prop("disabled", true);
            button.addClass("loading");
        }

        var url = '/Tarefa/DeleteAsync?token=' + self.GetUrlToken();
        $.post(url, postData, function (response) {
            if (response.Success == false) {
                self.ShowErrorToastMessage('Erro ao deletar a tarefa!', response.Message);
                return;
            }

            var idHtml = 'task_' + idTarefa;
            self.CloseModalConfirmacaoExclusaoTarefa();
            self.CloseOrCancelAnnotationModal(idHtml, true);
            self.ShowSuccessToastMessage(`Tarefa deletada com sucesso!`, `A tarefa foi deletada com sucesso do documento.`);

        }).fail(function (jqXHR, textStatus, errorThrown) {
            self.ShowErrorAlert("Ocorreu um erro ao deletar a tarefa. Tente novamente e se o erro continuar, por favor, reporte um issue");
        }).always(function () {
            if (button) {
                //button.html(self.GetTrashIcon());
                button.html('Excluir');
                button.prop("disabled", false);
                button.removeClass("loading");
            }
        });
    };

    self.GetTrashIcon = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M4.66683 2.33332L4.9277 1.81157C4.93817 1.79063 4.94923 1.7701 4.96083 1.74999C5.16824 1.39057 5.55272 1.16666 5.9712 1.16666H8.02912C8.44761 1.16666 8.83208 1.39057 9.0395 1.74999C9.0511 1.7701 9.06215 1.79063 9.07262 1.81157L9.3335 2.33332H11.0835C11.4057 2.33332 11.6668 2.59449 11.6668 2.91666V3.49999H2.3335V2.91666C2.3335 2.59449 2.59466 2.33332 2.91683 2.33332H4.66683ZM4.0835 5.83332V11.6667H9.91683V5.83332H4.0835ZM2.91683 11.6667C2.91683 12.311 3.43916 12.8333 4.0835 12.8333H9.91683C10.5612 12.8333 11.0835 12.311 11.0835 11.6667V4.66666H2.91683V11.6667Z" fill="#F45757"/>
            </svg>
        `;
    };

    self.CloseOrCancelAnnotationModal = function (id, forceIsCriacao) {
        var isCriacao = null;
        if (forceIsCriacao) {
            isCriacao = forceIsCriacao;
        } else {
            var idTarefa = $(`#${id} #IdTarefa`).val();
            isCriacao = idTarefa == "0";
        }
        
        if (isCriacao) {
            self.ANNOTATION_PLUGIN.destroyAnnotation(id);
        }

        self.HideAnnotationLabelById(id);
        self.ShowAllTasks();
    };

    self.ShowLoaderEditarTarefas = function (idTarefa) {
        if (!idTarefa) return;

        self.ToggleDropdownMenu(null, idTarefa);
        
        var element = $('#task_' + idTarefa).find('#loaderEditarTarefas');
        if (element)
            $(element).removeClass('fadeOut');
    };

    self.HideLoaderEditarTarefas = function (idTarefa) {
        if (!idTarefa) return;

        var element = $('#task_' + idTarefa).find('#loaderEditarTarefas');
        if (element)
            $(element).addClass('fadeOut');
    };

    self.OpenEditarTarefaFromVisualizacaoSimplificada = async function (element, idTarefa) {
        var haveToReturn = $(element).hasClass('custom-blocked-class');
        if (haveToReturn) return;

        self.ShowLoaderEditarTarefas(idTarefa);

        var html = await self.GetPersistTarefaModalHtml(idTarefa);
        var htmlElement = $(html).html();

        var haveToReturn = $(element).hasClass('custom-blocked-class');
        if (haveToReturn) return;

        $('#task_' + idTarefa).html(htmlElement);
        $('#task_' + idTarefa).css('opacity', 1);

        setTimeout(function () {
            self.EnableEventsForAnnotation('task_' + idTarefa);
            self.HideLoaderEditarTarefas(idTarefa);
        }, 90);
    };

    self.CopiarLinkVisualizacaoSimplificada = function (urlTarefa) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(urlTarefa).then(() => {
                self.ShowSuccessToastMessage('Link copiado com sucesso!');
            }).catch(() => {
                self.ShowErrorToastMessage('Falha ao copiar o link. Tente novamente.');
            });
        } else {
            self.ShowErrorToastMessage('Seu navegador não suporta copiar automaticamente. Por favor, copie manualmente.');
        }
    };

    self.DeletarTarefaFromVisualizacaoSimplificada = function (elmnt, idTarefa, tituloTarefa) {
        var btn = $(elmnt);
        var haveToReturn = $(elmnt).hasClass('custom-blocked-class');
        if (haveToReturn) return;

        self.ShowModalConfirmacaoExclusao(btn, idTarefa, tituloTarefa);
    };

    self.GetConfirmacaoExclusaoModalHtml = function (idTarefa, tituloTarefa) {
        var title = "Excluindo tarefa";
        var customArea = `Tem certeza que deseja excluir <strong>${tituloTarefa}</strong>?`;
        var html = `
            <div id="meuModal" class="modal-confirmacao-exclusao-vista modal">
                <div class="modal-conteudo modal-conteudo-confirmacao-exclusao-vista">
                    <div class="modal-body">
                        <div class="modal-confirmacao-title-area">
                            <div class="confirmacao-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23Z" fill="#F45757"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11 14V6H13V14H11ZM11 18L11 16H13L13 18H11Z" fill="#F45757"/>
                                </svg>
                            </div>
                            <div class="confirmacao-title">
                                ${title}
                            </div>
                        </div>
                        <div class="confirmacao-descricao">
                            ${customArea}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancelarModalConfirmacaoExclusaoVista">Cancelar</button>
                        <button id="salvarVisaoCompartilhadaBtn" class="btn-confirma-exclusao-vista active text-sm" onclick="return _mainModel.ConfirmDeleteTarefa(event, ${idTarefa})">
                            Excluir
                        </button>
                    </div>
                </div>
            </div>

        `;
        
        return html;
    };

    self.CloseModalConfirmacaoExclusaoTarefa = function () {
        $(".modal.modal-confirmacao-exclusao-vista").hide();
    };

    self.EnableEventsForConfirmacaoExclusaoModal = function () {
        document.querySelector('#cancelarModalConfirmacaoExclusaoVista').addEventListener('click', (event) => {
            self.CloseModalConfirmacaoExclusaoTarefa();
        });
    };

    self.ShowModalConfirmacaoExclusao = function (btn, idTarefa, tarefaNome) {
        if (!idTarefa) idTarefa = 0;
        if (!tarefaNome) tarefaNome = "";

        var html = self.GetConfirmacaoExclusaoModalHtml(idTarefa, tarefaNome);

        $("#modalConfirmacaoExclusaoVista").html("");
        $("#modalConfirmacaoExclusaoVista").append(html);
        $(".modal.modal-confirmacao-exclusao-vista").show();
        self.EnableEventsForConfirmacaoExclusaoModal();
    };

    self.ConfirmDeleteTarefa = function (event, idTarefa) {
        event.preventDefault();

        var btn = $(event.target);
        self.PostDeleteTask(btn, idTarefa);
    };

    self.ToggleDropdownMenu = function (event, idTarefa) {
        const dropdown = document.querySelector(`#task_${idTarefa} #dropdownMenu`);
        const isVisible = dropdown.style.display === 'block';
        if (isVisible) {
            dropdown.style.display = 'none';
            return;
        }

        self.EnableBootstrapTooltipForClass('.custom-blocked-class');
        dropdown.style.display = 'block';
        
        $(document).on('click', function (event) {
            const $dropdown = $(`#task_${idTarefa} #dropdownMenu`); 
            if (!$dropdown.is(event.target) && !$dropdown.has(event.target).length && !$(event.target).closest(`#task_${idTarefa} .visualizacao-tarefa-header-button`).length) {
                $dropdown.hide();
            }
        });
    };

    self.ToggleAttachMenu = function (event, idTarefa) {
        var target = event.target;
        var buttonElement = $(target);
        var menuDropDown = $(target).parent().find('#attachDropdownMenu');
        
        if (target.nodeName == 'svg') {
            menuDropDown = $(target).parent().parent().find('#attachDropdownMenu');
            buttonElement = $(buttonElement).parent();
        }

        if (target.nodeName == 'path') {
            buttonElement = $(buttonElement).parent().parent();
        }

        var cannotComment = $(buttonElement).hasClass('btn-disabled-comment');
        if (cannotComment) {
            return;
        }

        var haveToShow = $(menuDropDown).hasClass('haveToHide');
        if (haveToShow) {
            $(menuDropDown).removeClass('haveToHide');
            $(menuDropDown).addClass('haveToShow');
          
            $(menuDropDown).find('ul li').on("mouseenter", function (event) {   // Ativando o listener quando o menu é mostrado
                var isImg = $(event.target).hasClass('attach-img');
                var isOtherfile = $(event.target).hasClass('attach-file');

                if (isImg) {
                    var inputElement = $('.input-comment');
                    $(inputElement).attr("placeholder", "Envie imagens com comentário...");
                    return;
                }

                if (isOtherfile) {
                    var inputElement = $('.input-comment');
                    $(inputElement).attr("placeholder", "Envie um documento com comentário...");
                    return;
                }

                var inputElement = $('.input-comment');
                $(inputElement).attr("placeholder", "Digite seu comentário aqui");
            });
           
            $(menuDropDown).find('ul li').on("mouseleave", function (event) {  // Ativando o listener quando o menu é mostrado
                var inputElement = $('.input-comment');
                $(inputElement).attr("placeholder", "Digite seu comentário aqui");
            });
        } else {
            $(menuDropDown).removeClass('haveToShow');
            $(menuDropDown).addClass('haveToHide');

            // Removendo o listener quando o menu é escondido
            $(menuDropDown).find('ul li').off("mouseenter");
            $(menuDropDown).find('ul li').off("mouseleave");
        }
    };

    self.HandleAttachAction = function (type, idTarefa) {
        var idTarefaHtml = "#task_" + idTarefa;
        
        if (type == 'image') {
            $(idTarefaHtml + " #image-attachment").click();
        }

        if (type == 'document') {
            $(idTarefaHtml + " #file-attachment").click();
        }
    };

    self.EnableEventsForAnnotationIndex = function (id) {

        $("#" + id + " .annotation-close-icon").unbind();
        $("#" + id + " .annotation-close-icon").on("click", function () {
            self.CloseOrCancelAnnotationModal(id);
        });
        
        var elementPathStatusTarefa = "#" + id + " .selectStatusTarefa";
        var optionsForStatusTarefa = {
            templateResult: self.FormatSelect2ForTarefasStatusCombobox,
            templateSelection: self.FormatSelect2ForTarefasStatusComboboxSelected,
            minimumResultsForSearch: 20,
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
        };
        self.ConfigureSelect2(elementPathStatusTarefa, optionsForStatusTarefa);

        self.DisableBootstrapTooltipForClass('.statusTarefaArea');
        self.EnableBootstrapTooltipForClass('.statusTarefaArea');

        $(elementPathStatusTarefa).on("change", async function () {
            var idTarefa = id.split('_').pop();
            var status = $(this).val();
            var element = $(this);
            var canCompleteAnyTask = self._userActions.CanCompleteTasks;
            var canCompleteOwnTasks = self._userActions.CanCompleteSendedByMeTasks;
            var isUserTaskOwner = $(element).data("is-user-owner");
            var statusConcluido = "2";

            if (status == statusConcluido) {
                if (!canCompleteAnyTask && (!canCompleteOwnTasks || !isUserTaskOwner)) {
                    self.ShowWarningAlert("Seu perfil não tem permissão para concluir esta tarefa.");
                    //var oldValue = $(element).data("old-value");
                    //$(this).val(oldValue).trigger("change");
                    return;
                }
            }

            try {
                var url = `/Tarefa/UpdateTarefaStatusAsync?token=${self.GetUrlToken()}&idObra=${self.IdObra}&idUsuario=${self.IdUsuario}&idTarefa=${idTarefa}&status=${status}`;
                var response = await $.post(url, null);
                if (!response.Success) {

                    if (response.Message && response.Message.includes("permissão")) {
                        self.ShowErrorToastMessage(response.Message);
                        return;
                    } else {
                        self.ShowErrorAlert("Ocorreu um erro ao atualizar o status da tarefa! Tente novamente e se o erro continuar, por favor, reporte um issue");
                        return;
                    }
                }

                self.ShowSuccessToastMessage("Status da tarefa atualizado com sucesso!");

            } catch (error) {
                self.ShowErrorAlert("Ocorreu um erro ao atualizar o status da tarefa! Tente novamente e se o erro continuar, por favor, reporte um issue");
            }
        });

        var elementPath = "#" + id + " .selectResponsavel"
        var options = {
            templateResult: self.FormatSelect2ForResponsaveisCombobox,
            templateSelection: self.FormatSelect2ForResponsaveisCombobox,
            minimumResultsForSearch: 10,
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
        };
        self.ConfigureSelect2(elementPath, options);

        var prazoInicialDatePickerHtmlElement = "#" + id + " input[name='prazoInicial']";
        var anchor = "#" + id + " .col-sm-9 .prazoInicialArea";
        self.StartDateRangePickerByHtmlPath(prazoInicialDatePickerHtmlElement, "Prazo inicial", anchor, "right");

        var prazoFinalDatePickerHtmlElement = "#" + id + " input[name='prazoFinal']";
        var anchorPrazonFInal = "#" + id + " .col-sm-9 .prazoFinalArea";
        self.StartDateRangePickerByHtmlPath(prazoFinalDatePickerHtmlElement, "Prazo final", anchorPrazonFInal, "left");

        self.EnableFileAndImageAttachmentEvents(id);

        self.EnableBootstrapTooltipForClass('.btn-disabled-comment');
    };

    self.EnableFileAndImageAttachmentEvents = function (idTarefaHtml) {
        idTarefaHtml = "#" + idTarefaHtml;
        var imgAttachmentMenu = idTarefaHtml + " #image-attachment";
        
        $(imgAttachmentMenu).off("change").on("change", function (e) {
            const files = e.target.files;
            const allowedImageExtensions = [
                "xbm", "tif", "tiff", "pjp", "apng", "jpeg", "heif", "ico", "tiff", "webp",
                "svgz", "jpg", "heic", "gif", "svg", "png", "bmp", "pjpeg", "avif"
            ];
            
            if ($(idTarefaHtml + " #image-previews").children().length > 0) {
                self.ShowErrorToastMessage('Já contém um arquivo anexo.', 'Remova o arquivo antes de realizar um novo envio.');
                return;
            }
            
            const file = files[0];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (!allowedImageExtensions.includes(fileExtension)) {
                self.ShowErrorToastMessage(`O arquivo "${file.name}" não é uma imagem válida.`);
                event.target.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const img = `
                    <div class="attachment-preview">
                        <img src="${event.target.result}" alt="Imagem">
                        <button class="remove-attachment">&times;</button>
                    </div>
                `;

                $(idTarefaHtml + " #image-previews").empty();
                $(idTarefaHtml + " #image-previews").append(img);
            };

            reader.readAsDataURL(file);

            $(idTarefaHtml + ' .btn-attach').click();
        });

        $(idTarefaHtml + " #file-attachment").on("change", function (e) {
            const files = e.target.files;
            Array.from(files).forEach(file => {
                const filePreview = `
                        <div class="attachment-preview">
                            <span class="attachment-name">${file.name}</span>
                            <button class="remove-attachment">&times;</button>
                        </div>
                    `;
                $("#image-previews").append(filePreview); // Adicionado ao mesmo contêiner de imagens
            });
        });

        $(document).on("click", idTarefaHtml + " .remove-attachment", function () {
            $(idTarefaHtml + " #image-attachment").val("");

            $(this).parent().remove();
        });
    };

    self.EnableEventsForAnnotation = function (id) {
        $("#" + id + " .annotation-close-icon").unbind();
        $("#" + id + " .annotation-close-icon").on("click", function () {
            self.CloseOrCancelAnnotationModal(id);
        });

        $("#" + id + " #cancelarModalCriarTarefaBtn").unbind();
        $("#" + id + " #cancelarModalCriarTarefaBtn").on("click", function () {
            self.CloseOrCancelAnnotationModal(id);
        });

        $("#" + id + " #salvarTarefaBtn").unbind();
        $("#" + id + " #salvarTarefaBtn").on("click", function () {
            var $button = $(this);
            self.PostCreateNewTask($button, id);
        });

        $("#" + id + " .annotation-remove-icon").unbind();
        $("#" + id + " .annotation-remove-icon").on("click", function () {
            var rawIdValue = $("#" + id + " #IdTarefa").val();
            var intIdValue = (rawIdValue) ? parseInt(rawIdValue) : 0;
            var $button = $(this);
            if (intIdValue > 0) {
                self.PostDeleteTask($button, intIdValue);
            } else {
                self.CloseOrCancelAnnotationModal(id);
            }
        });

        $("#" + id + " #tituloTarefa").focus();

        var elementPath = "#" + id + " .content-section form .selectResponsavel"
        var options = {
            templateResult: self.FormatSelect2ForResponsaveisCombobox,
            templateSelection: self.FormatSelect2ForResponsaveisCombobox,
            minimumResultsForSearch: 10,
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
        };
        self.ConfigureSelect2(elementPath, options);
        
        var elementPathStatusTarefa = "#" + id + " .content-section form .selectStatusTarefa";
        var optionsForStatusTarefa = {
            templateResult: self.FormatSelect2ForTarefasStatusCombobox,
            templateSelection: self.FormatSelect2ForTarefasStatusComboboxSelected,
            minimumResultsForSearch: 10,
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
        };
        self.ConfigureSelect2(elementPathStatusTarefa, optionsForStatusTarefa);
        
        self.DisableBootstrapTooltipForClass('.enableTooltTipStatusPermission');
        self.EnableBootstrapTooltipForClass('.enableTooltTipStatusPermission');

        var elementPathTipoTarefa = "#" + id + " .content-section form .selectTIpoTarefa";
        var optionsForStatusTarefa = {
            minimumResultsForSearch: 10,
            placeholder: "Selecione...",
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
        };
        self.ConfigureSelect2(elementPathTipoTarefa, optionsForStatusTarefa);

        var elementPathRelevanciaTarefa = "#" + id + " .content-section form .selectRelevanciaTarefa";
        var optionsForRelevanciaTarefa = {
            templateResult: self.FormatSelect2ForRelevanciaCombobox,
            templateSelection: self.FormatSelect2ForRelevanciaCombobox,
            minimumResultsForSearch: 10,
            placeholder: "Selecione...",
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
        };
        self.ConfigureSelect2(elementPathRelevanciaTarefa, optionsForRelevanciaTarefa);

        var elementPathDisciplinasTarefa = "#" + id + " .content-section form .selectDisciplinasTarefa";
        var optionsForDisciplinasTarefa = {
            minimumResultsForSearch: 3,
            placeholder: "Selecione...",
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
        };
        self.ConfigureSelect2(elementPathDisciplinasTarefa, optionsForDisciplinasTarefa);

        var elementPathParticipantesTarefa = "#" + id + " .content-section form .selectParticipantes";
        var optionsForParticipantesTarefa = {
            templateResult: self.FormatSelect2ForParticipantesCombobox,
            templateSelection: self.FormatSelect2ForParticipantesComboboxSelected,
            minimumResultsForSearch: 3,
            placeholder: "Selecione...",
            allowClear: false,
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            }
        };
        self.ConfigureSelect2(elementPathParticipantesTarefa, optionsForParticipantesTarefa);

        self.EnableBootstrapTooltipForClass('.tooltipoIconInfoCircle');

        var elementPathLocaisTarefa = "#" + id + " .content-section form .selectLocais";
        var optionsForLocaisTarefa = {
            minimumResultsForSearch: 3,
            placeholder: "Selecione...",
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
        };
        self.ConfigureSelect2(elementPathLocaisTarefa, optionsForLocaisTarefa);

        var prazoInicialPickerHtmlElement = "#" + id + " .content-section form input[name='prazoInicial']";
        var anchor = "#" + id + " .content-section .propriedades-row .col-sm-8 .prazoInicialArea";
        self.StartDateRangePickerByHtmlPath(prazoInicialPickerHtmlElement, "Prazo inicial", anchor, "right");
        
        var prazoFinalPickerHtmlElement = "#" + id + " .content-section form input[name='prazoFinal']";
        var anchorPrazonFInal = "#" + id + " .content-section .propriedades-row .col-sm-8 .prazoFinalArea";
        self.StartDateRangePickerByHtmlPath(prazoFinalPickerHtmlElement, "Prazo final", anchorPrazonFInal, "left");

        //self.HabilitarEditorHtmlByHtmlPath("#editor");

        var elementPathFaseTarefa = "#" + id + " .content-section form #fase";
        var optionsForFasesTarefa = {
            minimumResultsForSearch: 3,
            placeholder: "Selecione...",
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
        };
        self.ConfigureSelect2(elementPathFaseTarefa, optionsForFasesTarefa);

        var elementPathCategoriaTarefa = "#" + id + " .content-section form #idCategoria";
        var optionsForCategoriaTarefa = {
            templateResult: self.FormatSelect2ForCategoriaTarefasCombobox,
            templateSelection: self.FormatSelect2ForCategoriaTarefasCombobox,
            minimumResultsForSearch: 10,
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            }
        };
        self.ConfigureSelect2(elementPathCategoriaTarefa, optionsForCategoriaTarefa);

        var elementPathTagsTarefa = "#" + id + " .content-section form .selectTags";
        var optionsForTagsTarefa = {
            minimumResultsForSearch: 3,
            placeholder: "Selecione...",
            tags: true,
            language: {
                noResults: function () {
                    return 'Nenhum resultado encontrado';
                }
            },
            tokenSeparators: [',', ';'],
        };
        self.ConfigureSelect2(elementPathTagsTarefa, optionsForTagsTarefa);

        $("#" + id + " .content-section .propriedades-area .propriedades-header .close-icon-propriedades").on('click', function () {
            var element = $(this);
            var areaToHide = $(element).parent().parent().parent().find('.propriedades-content');
            var haveToHide = $(areaToHide).hasClass('haveToShow');
            
            if (haveToHide) {
                $(areaToHide).removeClass('haveToShow');
                $(areaToHide).addClass('haveToHide');
                $(element).html('');
                $(element).html(self.GetCCArrowRightSVG());
                
            } else {
                $(areaToHide).addClass('haveToShow');
                $(areaToHide).removeClass('haveToHide');
                $(element).html('');
                $(element).html(self.GetCCArrowDownSVG());
            }
        });

        self.HabilitarDropZoneModalTarefas(id);

        self.HabilitarCopiarColarNoDropZone(id); 
        
        self.EnableRadioButtonTarefaPrivada(id);

        self.EnableEventsForModalTarefasPRO();
    };

    self.EnableEventsForModalTarefasPRO = function () {
        $('.custom-disabled-tarefas-pro *').on('click', function () {
            self.ShowModalTarefasPro();
        });
      
        self.EnableBootstrapTooltipForClass('.custom-disabled-tarefas-pro')
    };

    self.EnableRadioButtonTarefaPrivada = function (id) {
        
        var isTarefaPrivadaObj = $(`#${id} .content-section form #IsTarefaPrivada`);

        if (isTarefaPrivadaObj && isTarefaPrivadaObj.length) {
            var option = $(isTarefaPrivadaObj).is(":checked");
            $(isTarefaPrivadaObj).prop("checked", option);
        }
    };

    self.LastSizeOnPaste = '';
    self.HabilitarCopiarColarNoDropZone = function (id) {
        const modalElement = $("#" + id);

        if (modalElement && modalElement.length > 0) {
            const dzState = self.GetDropzoneState(id);
            // Adiciona o evento de 'paste' apenas ao modal correspondente
            modalElement.on('paste', async (e) => {
                const clipboardItems = e.originalEvent.clipboardData.files;

                for (const clipboardItem of clipboardItems) {
                    if (clipboardItem.type.startsWith('image/')) {
                        const dropZoneElement = modalElement.find("#custom-dropzone:visible");
                        if (dropZoneElement.length > 0) {
                            let fileName = clipboardItem.name;
                            let fileSize = clipboardItem.size;
                            let isImgComingFromAprintOrIsNamedImgPNG = fileName === "image.png";

                            // Verifica cenário onde é a imagem está vindo de um printscreen e possui exatamente o mesmo tamanho da anterior, ou seja, mesmo print/imagem.
                            if (isImgComingFromAprintOrIsNamedImgPNG && fileSize === self.LastSizeOnPaste) {
                                return false; 
                            }
                            self.LastSizeOnPaste = fileSize;

                            // Renomea imagens diferentes que vieram de prints diferentes para passar na regra de upload com nomes iguais.
                            if (isImgComingFromAprintOrIsNamedImgPNG) {
                                const uniqueSuffix = Date.now(); 
                                fileName = `image_${uniqueSuffix}.png`;
                                clipboardItem.name = fileName;
                            }

                            // Regra nomes iguais
                            const renamedFile = new File([clipboardItem], fileName, { type: clipboardItem.type });
                            const fileExists = dzState.UploadedFileListHidden.some(file => file.name === renamedFile.name);
                            if (fileExists) {
                                self.RemoveDropZonePreVizualizationChanges(id);
                                continue;
                            }
                            dzState.UploadFileCount++;
                            dzState.UploadedFileListHidden.push(clipboardItem);

                            const myDropzone = Dropzone.forElement(`#${id} .content-section form #custom-dropzone`);
                            self.UploadFileList(clipboardItem, id, myDropzone, dzState);
                            myDropzone.addFile(clipboardItem);

                            self.RemoveDropZonePreVizualizationChanges(id);
                        }

                        const uploadButtonElement = modalElement.find(".btnUploadImage:visible");
                        if (uploadButtonElement.length > 0) {
                            uploadFile({
                                value: clipboardItem.name,
                                files: [clipboardItem]
                            });
                            
                            const fotoInput = modalElement.find("#fotoInput")[0];
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(clipboardItem);
                            fotoInput.files = dataTransfer.files;
                        }
                    }
                }
            });
        }
    };

    self.GetDoubleImageIconSVG = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M2.0415 2.33341C2.0415 1.68908 2.56384 1.16675 3.20817 1.16675H12.5415C13.1858 1.16675 13.7082 1.68908 13.7082 2.33341V9.91675C13.7082 10.5611 13.1858 11.0834 12.5415 11.0834H3.20817C2.56384 11.0834 2.0415 10.5611 2.0415 9.91675V2.33341ZM3.20817 2.33341V9.91675H12.5415V2.33341H3.20817Z" fill="#A7A7A7"/>
              <path d="M3.7915 8.16675L7.05817 4.08342L9.0415 6.6819L9.9165 5.56826L11.9582 8.16675H3.7915Z" fill="#A7A7A7"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M0.291504 4.08342C0.291504 3.43908 0.813838 2.91675 1.45817 2.91675V11.6667H11.9582C11.9582 12.3111 11.4358 12.8334 10.7915 12.8334H1.45817C0.813839 12.8334 0.291504 12.3111 0.291504 11.6667V4.08342Z" fill="#A7A7A7"/>
            </svg>
        `;
    }

    self.GetCircleIconSvg = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
              <g clip-path="url(#clip0_1421_8997)">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M0.666504 2.00008C0.666504 2.73646 1.26346 3.33341 1.99984 3.33341C2.73622 3.33341 3.33317 2.73646 3.33317 2.00008C3.33317 1.2637 2.73622 0.666748 1.99984 0.666748C1.26346 0.666748 0.666504 1.2637 0.666504 2.00008Z" fill="#D6D6D6"/>
              </g>
              <defs>
                <clipPath id="clip0_1421_8997">
                  <rect width="4" height="4" fill="white"/>
                </clipPath>
              </defs>
            </svg>
        `;
    };

    self.GetFileContentTemplateHtml = function (e, file) {
        let fileExtension = file.type.split('/').pop().toUpperCase();
        let fileSize = (file.size / 1024).toFixed(2) + " KB";
        let fileName = file.name;
        return `
            <div class="file-info">
                <img src="${e.target.result}" alt="${fileName}">
                <div class="file-info-area">
                    <div class="file-name">${fileName}</div>
                      <div class="other-file-info">
                        <div class="file-extension">${fileExtension}</div>
                        <div clas="info-spliter">
                            ${self.GetCircleIconSvg()}
                        </div>
                        <div class="file-size">${fileSize}</div>
                        <span class="file-remove-btn trash-item-alignment" data-file-name="${fileName}">
                            ${self.GetTrashIcon()}
                        </span>
                    </div>
                </div>
            </div>
        `;
    };

    self.GetDropZoneHeaderElement = function (dzState) {
        const fileDescription = dzState.UploadFileCount === 1 ? "imagem" : "imagens";
        return `${self.GetDoubleImageIconSVG()} <div style="display: inline-block;"> <span class="totalFileCount">${dzState.UploadFileCount}</span> <span>${fileDescription}</span> </div>`;
    };

    self.UploadFileList = function (file, id, myDropzone, dzState) {
        const fileListContainer = dzState.GetFileListContainer();
        const fileListHeader = dzState.GetFileListHeader();
        const fileList = dzState.GetFileList();
        const headerHtml = self.GetDropZoneHeaderElement(dzState);


        fileListContainer.show();
        fileListHeader.html(headerHtml);

        const fileItem = $("<div>", {
            class: "file-item",
            "data-file-name": file.name,
        });
        
        const reader = new FileReader();
        reader.onload = function (e) {
            let fileContent = self.GetFileContentTemplateHtml(e, file);

            fileItem.html(fileContent);
            fileList.append(fileItem);
            
            fileItem.find(".file-remove-btn").on("click", function () {
                const fileName = $(this).data("file-name");
                self.RemoveFileFromList(fileName, id, myDropzone, dzState);
            });
        };
        reader.readAsDataURL(file);
    };

    self.RemoveFileFromDropzone = function (fileName, id, dzState) {
        const fileListContainer = dzState.GetFileListContainer();
        const fileListHeader = dzState.GetFileListHeader();
        const fileList = dzState.GetFileList();
        const fileItem = fileList.find(`.file-item[data-file-name="${fileName}"]`);

        if (fileItem.length) {
            fileItem.remove();
            dzState.UploadFileCount--;
            const headerHtml = self.GetDropZoneHeaderElement(dzState);
            fileListHeader.html(headerHtml);

            if (dzState.UploadFileCount === 0) {
                fileListContainer.hide();
            }
        }
    };

    self.RemoveFileFromList = function (fileName, id, myDropzone, dzState) {
        const fileListContainer = dzState.GetFileListContainer();
        const fileListHeader = dzState.GetFileListHeader();
        const fileList = dzState.GetFileList();
        const fileItem = fileList.find(`.file-item[data-file-name="${fileName}"]`);

        if (fileItem.length) {
            fileItem.remove();
            dzState.UploadFileCount--;

            let headerHtml = self.GetDropZoneHeaderElement(dzState);
            fileListHeader.html(headerHtml);

            if (dzState.UploadFileCount === 0) {
                fileListContainer.hide();
            }
            
            let filesToRemove = myDropzone.files.filter((file) => file.name === fileName);
            if (filesToRemove.length) {
                myDropzone.files = myDropzone.files.filter((file) => file.name !== fileName);
                dzState.UploadedFileListHidden = dzState.UploadedFileListHidden.filter((file) => file.name !== fileName);
            }
        }
    };

    self.RemoveDropZonePreVizualizationChanges = function (id) {
        const dzElement = $("#" + id + " .content-section form #custom-dropzone");
        dzElement.find(".dz-preview").remove(); // Remove pré-visualizações do Dropzone
    };

    self.GetDropzoneState = function (id) {
        if (!self.DropzoneStates[id]) {
            
            let totalDocsPreRenderedText = $("#" + id + " .content-section form #file-list-header .totalFileCount").text();
            let totalDocsPreRendered = (totalDocsPreRenderedText) ? parseInt(totalDocsPreRenderedText.trim()) : 0;
           

            self.DropzoneStates[id] = {
                UploadFileCount: 0 + totalDocsPreRendered,
                UploadedFileListHidden: [],
                GetFileListContainer: function () {
                    return $("#" + id + " .content-section form #file-list-container");
                },
                GetFileListHeader: function () {
                    return $("#" + id + " .content-section form #file-list-header");
                },
                GetFileList: function () {
                    return $("#" + id + " .content-section form #file-list");
                }
            };
        }
        return self.DropzoneStates[id];
    };

    self.DestroyDropZone = function (id) {
        var elementoSelector = "#" + id + " .content-section form #custom-dropzone";
        var dropzoneElement = Dropzone.forElement(elementoSelector);
        if (dropzoneElement) {
            dropzoneElement.destroy();
        } 
    };
    
    self.HabilitarDropZoneModalTarefas = function (id) {
        const element = $("#" + id + " .content-section form #custom-dropzone");
        if (element && element.length > 0) {
            const dzState = self.GetDropzoneState(id);
            Dropzone.autoDiscover = false;

            const myDropzone = new Dropzone("#" + id + " .content-section form #custom-dropzone", {
                url: "#",
                //maxFilesize: self.DropZoneConfiguration.MaxFilesizeInMegaBytes, por enquanto não vai ter essa regra
                acceptedFiles: self.DropZoneConfiguration.AcceptedFiles,
                addRemoveLinks: self.DropZoneConfiguration.AddRemoveLinks,

                init: function () {
                    this.on("addedfile", function (file) {
                        const fileExists = dzState.UploadedFileListHidden.some((f) => f.name === file.name);
                        if (fileExists) {
                            self.RemoveDropZonePreVizualizationChanges(id);
                            return;
                        }
                        dzState.UploadFileCount++;
                        dzState.UploadedFileListHidden.push(file);
                        
                        self.UploadFileList(file, id, myDropzone, dzState);

                        self.RemoveDropZonePreVizualizationChanges(id);
                    });

                    this.on("removedfile", function (file) {
                        const index = dzState.UploadedFileListHidden.findIndex((f) => f.name === file.name);
                        if (index > -1) {
                            dzState.UploadedFileListHidden.splice(index, 1);
                        }

                        self.RemoveFileFromDropzone(file.name, id, dzState);
                    });
                },
            });
        }
    };

    self.GetCCArrowDownSVG = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.00004 8.70715L10.8536 3.8536L10.1465 3.14649L6.00004 7.29294L1.85359 3.14649L1.14648 3.8536L6.00004 8.70715Z" fill="#6F6F6F" />
            </svg>
        `;
    };

    self.GetCCArrowRightSVG = function () {
        return `
           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 2.29289L9.29289 6L4.29289 9.70711L3.58579 9L7.87868 6L3.58579 3L4.29289 2.29289Z" fill="#6F6F6F"/>
        </svg>
        `;
    };

    self.HabilitarEditorHtmlByHtmlPath = function (htmlPath) {
        // Se descomentar no html o uso da lib e o elemento de htmlPath já funciona
        //var quill = new Quill(htmlPath, {
        //    theme: 'snow',
        //    modules: {
        //        toolbar: [
        //            ['bold', 'italic', 'underline', 'strike'],
        //            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        //            [{ 'align': [] }],
        //            ['link']
        //        ]
        //    }
        //});

    };

    self.GetDateRangePickerDefaultOption = function (parentEl = "body", position = "center") {
        var obj =  
        {
            locale: {
            format: "DD/MM/YYYY",
            separator: " - ",
            applyLabel: "Concluir",
            cancelLabel: "Cancelar",
            fromLabel: "De",
            toLabel: "Até",
            customRangeLabel: "Personalizado",
            weekLabel: "W",
                daysOfWeek: [
                    "D",
                    "S",
                    "T",
                    "Q",
                    "Q",
                    "S",
                    "S"
                ],
                monthNames: [
                    "Janeiro",
                    "Fevereiro",
                    "Março",
                    "Abril",
                    "Maio",
                    "Junho",
                    "Julho",
                    "Agosto",
                    "Setembro",
                    "Outubro",
                    "Novembro",
                    "Dezembro"
                ],
                firstDay: 1
            },
            singleDatePicker: true,
            showDropdowns: true,
            minYear: new Date().getFullYear() - 5,
            maxYear: new Date().getFullYear() + 10,
            autoUpdateInput: false,
            opens: position,
            parentEl
        }
        return obj;
    };

    self.StartDateRangePickerByHtmlPath = function (htmlpath, placeholder, anchorElement = "body", customPosition = "center") {
        $(htmlpath).daterangepicker(
            self.GetDateRangePickerDefaultOption(anchorElement, customPosition),
            function (start, end, label) { }
        );

        $(htmlpath).attr("placeholder", placeholder);

        $(htmlpath).on('apply.daterangepicker', function (ev, picker) {
            $(this).val(picker.startDate.format("DD/MM/YYYY"));
        });

        $(htmlpath).on('cancel.daterangepicker', function (ev, picker) {
            $(this).val('');
            $(this).attr("placeholder", placeholder);
        });
    };

    self.GetRelevanciaIconByDescription = function (text) {
        switch (text) {
            case "Alta":
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00014 7.31325L12.5716 11.8847L11.1981 13.2581L8.00014 10.0602L4.80216 13.2581L3.42871 11.8847L8.00014 7.31325Z" fill="#F45757"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00014 2.74182L12.5716 7.31325L11.1981 8.6867L8.00014 5.48872L4.80216 8.6867L3.42871 7.31325L8.00014 2.74182Z" fill="#F45757"/>
                    </svg>
                `;
                break;
            case "Média":
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3.42871 8.64575H12.5716V10.5886H3.42871V8.64575Z" fill="#A7A7A7"/>
                        <path d="M3.42871 5.41138H12.5716V7.35423H3.42871V5.41138Z" fill="#A7A7A7"/>
                    </svg>
                `;
                break;
            case "Baixa":
            default:
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00014 8.68675L12.5716 4.11532L11.1981 2.74187L8.00014 5.93985L4.80216 2.74187L3.42871 4.11532L8.00014 8.68675Z" fill="#4AA45F"/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00014 13.2582L12.5716 8.68675L11.1981 7.3133L8.00014 10.5113L4.80216 7.3133L3.42871 8.68675L8.00014 13.2582Z" fill="#4AA45F"/>
                    </svg>
                `;
                break;
        }
    };

    self.FormatSelect2ForRelevanciaCombobox = function (state) {
        if (!state.id) {
            return state.text;
        }

        var element = $(state.element)[0];
        var icon = self.GetRelevanciaIconByDescription(state.text);
        
        if (element && icon) {
            var $state = $(
                `<span style="display: flex;flex-direction: row;justify-content: left;align-items: center; min-width: 100px; margin-top:6px!important" >
                    ${icon}
                    <p class="selectComboboxResponsaveisFont combobox-font-color" style="margin: 0px;">${state.text}</p>
                </span>`
            );
        }

        return $state;

    };

    self.FormatSelect2ForResponsaveisCombobox = function (state) {
        if (!state.id) {
            return state.text;
        }

        var element = $(state.element)[0];
        var url = $(element).data("profile-url");
        if (!url) url = "../assets/img/engineer2.png";

        if (element && url) {
            var $state = $(
                ` <span style="display: flex;flex-direction: row;justify-content: left;align-items: center; margin-top: 4px;" >
                    <img src="${url}" class="rounded-circle profile-image-for-reponsaveis" onerror='../assets/img/engineer2.png'>
                    <p class="selectComboboxResponsaveisFont combobox-font-color" style="margin: 0px;">${state.text}</p>
                </span>`
            );
        }

        return $state;
    };

    self.FormatSelect2ForParticipantesCombobox = function (state) {
        if (!state.id) {
            return state.text;
        }

        var element = $(state.element)[0];
        var url = $(element).data("profile-url");
        if (element && url) {
            var $state = $(
                ` <span style="display: flex;flex-direction: row;justify-content: left;align-items: center; margin-top: 4px;">
                    <img src="${url}" class="rounded-circle profile-image-for-reponsaveis" onerror="this.onerror=null; this.src='../assets/img/engineer2.png'">
                    <p class="selectComboboxResponsaveisFont combobox-font-color" style="margin: 0px;">${state.text}</p>
                </span>`
            );
        }

        return $state;
    };

    self.FormatSelect2ForParticipantesComboboxSelected = function (state) {
        if (!state.id) {
            return state.text;
        }

        var element = $(state.element)[0];
        var imgUrl = $(element).data("profile-url");

        if (!imgUrl) {
            imgUrl = "path/to/default/image.jpg"; 
        }

        var $state = $(
            `<span style="display: inline-flex; align-items: center;">
                <img src="${imgUrl}" class="rounded-circle profile-image-for-reponsaveis" style="width: 24px; height: 24px; margin-right: 5px;" onerror="../assets/img/engineer2.png">
                <p class="selectComboboxResponsaveisFont combobox-font-color" style="margin: 0px;">${state.text}</p>
            </span>`
        );

        var $container = $('<span style="display: inline-flex; align-items: center;"></span>');
        $container.append($state);

        return $container;
    };

    self.FormatSelect2ForCategoriaTarefasCombobox = function (state) {
        if (!state.id) {
            return state.text;
        }

        var element = $(state.element)[0];
        var statusColor = $(element).data("custom-status-color");

        if (element && statusColor) {
            var $state = $(
                ` <div style="display: flex; flex-direction: row; justify-content: left; align-items: center;" >
                    <span style="diaplay: block; border-radius: 3px; width: 10px; height: 10px; background-color: ${statusColor}; margin-left: 4px; margin-right: 8px; margin-top: 0px!important;"></span>
                    <p class="selectComboboxTarefasStatusFont combobox-font-color ellipsis" style="margin: 0px; font-size: 12px!important;">${state.text}</p>
                </div>`
            );
        }

        return $state;
    };

    self.FormatSelect2ForCategoriaTarefasComboboxSelected = function (state) {
        if (!state.id) {
            return state.text;
        }

        var element = $(state.element)[0];
        var statusColor = $(element).data("custom-status-color");

        if (element && statusColor) {
            var $state = $(
                `<div style="display: flex;flex-direction: row;justify-content: left;align-items: center; border-radius: 4px; background-color: ${statusColor}; padding: 2px 4px; max-height: 16px; gap: 4px;">
                    <p class="selectComboboxTarefasStatusFont combobox-font-color ellipsis" style="color: #fff; margin: 0px; font-size: 12px!important;">${state.text}</p>
                 </div>
                `
            );
        }

        return $state;
    };

    self.FormatSelect2ForTarefasStatusCombobox = function (state) {
        if (!state.id) {
            return state.text;
        }

        var element = $(state.element)[0];
        var statusColor = $(element).data("custom-status-color");
        
        if (element && statusColor) {
            var $state = $(
                ` <div style="display: flex; flex-direction: row; justify-content: left; align-items: center;" >
                    <span style="diaplay: block; border-radius: 3px; width: 10px; height: 10px; background-color: ${statusColor}; margin-left: 4px; margin-right: 8px;"></span>
                    <p class="selectComboboxTarefasStatusFont combobox-font-color ellipsis" style="margin: 0px; font-size: 12px!important;">${state.text}</p>
                </div>`
            );
        }

        return $state;
    };

    self.FormatSelect2ForTarefasStatusComboboxSelected = function (state) {
        if (!state.id) {
            return state.text;
        }

        var element = $(state.element)[0];
        var statusColor = $(element).data("custom-status-color");
        var selectElement = $(element).parent();
        var oldValue = $(selectElement).data("old-value");
        var oldColor = $(selectElement).data("old-color");
        var oldText = $(selectElement).data("old-text");
        
        if (state.element.value == "2") {
            var canCompleteAnyTask = self._userActions.CanCompleteTasks;
            var canCompleteOwnTasks = self._userActions.CanCompleteSendedByMeTasks;
            var isUserTaskOwner = $(selectElement).data("is-user-owner");

            if (!canCompleteAnyTask && (!canCompleteOwnTasks || !isUserTaskOwner)) {
                if (oldColor) {
                    var $state = $(
                        `
                            <div style="display: flex;flex-direction: row;justify-content: left;align-items: center; border-radius: 4px; background-color: ${oldColor}; padding: 2px 4px; max-height: 16px; gap: 4px;">
                                <p class="selectComboboxTarefasStatusFont combobox-font-color ellipsis" style="color: #fff; margin: 0px; font-size: 12px!important;">${oldText}</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.00019 7.25592L9.04482 3.21129L8.45557 2.62204L5.00019 6.07741L1.54482 2.62204L0.955566 3.21129L5.00019 7.25592Z" fill="white"/>
                                </svg>
                            </div>
                        `
                    );

                    return $state;
                }
            }
        }

        if (element && statusColor) {
            var $state = $(
                `
                <span style="display: flex;flex-direction: row;justify-content: left;align-items: center; border-radius: 4px; background-color: ${statusColor}; padding: 2px 4px; max-height: 16px; gap: 4px;">
                    <p class="selectComboboxTarefasStatusFont combobox-font-color ellipsis" style="color: #fff; margin: 0px; font-size: 12px!important;">${state.text}</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M5.00019 7.25592L9.04482 3.21129L8.45557 2.62204L5.00019 6.07741L1.54482 2.62204L0.955566 3.21129L5.00019 7.25592Z" fill="white"/>
                    </svg>
                </span>`
            );
        }

        return $state;
    };

    self.GetPlanBadgeSVG = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none" style="display: inline-block;">
                <g filter="url(#filter0_di_1421_8491)">
                <rect width="14" height="14" rx="4" fill="#E5E5E5"/>
                <g clip-path="url(#clip0_1421_8491)">
                <path d="M7.00016 2.83331C7.17257 2.83331 7.32717 2.93949 7.38906 3.1004L8.11163 4.9791C8.2368 5.30453 8.27613 5.39831 8.32993 5.47398C8.38391 5.5499 8.45025 5.61623 8.52617 5.67021C8.60183 5.72401 8.69561 5.76334 9.02104 5.88851L10.8997 6.61109C11.0606 6.67298 11.1668 6.82757 11.1668 6.99998C11.1668 7.17238 11.0606 7.32698 10.8997 7.38887L9.02105 8.11145C8.69561 8.23662 8.60183 8.27595 8.52617 8.32975C8.45025 8.38373 8.38392 8.45006 8.32993 8.52598C8.27613 8.60165 8.2368 8.69543 8.11163 9.02086L7.38906 10.8996C7.32717 11.0605 7.17257 11.1666 7.00016 11.1666C6.82776 11.1666 6.67316 11.0605 6.61127 10.8996L5.88869 9.02086C5.76353 8.69543 5.72419 8.60165 5.67039 8.52598C5.61641 8.45006 5.55008 8.38373 5.47416 8.32975C5.3985 8.27595 5.30472 8.23662 4.97928 8.11145L3.10059 7.38887C2.93967 7.32698 2.8335 7.17238 2.8335 6.99998C2.8335 6.82757 2.93967 6.67298 3.10059 6.61109L4.97928 5.88851C5.30472 5.76334 5.3985 5.72401 5.47416 5.67021C5.55008 5.61623 5.61641 5.5499 5.67039 5.47398C5.72419 5.39831 5.76353 5.30453 5.88869 4.9791L6.61127 3.10041C6.67316 2.93949 6.82776 2.83331 7.00016 2.83331Z" fill="#545454"/>
                </g>
                </g>
                <defs>
                <filter id="filter0_di_1421_8491" x="0" y="0" width="14" height="14.75" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="0.75"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.0862745 0 0 0 0 0.0862745 0 0 0 0 0.0862745 0 0 0 0.25 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1421_8491"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1421_8491" result="shape"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="0.75"/>
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.07 0"/>
                <feBlend mode="normal" in2="shape" result="effect2_innerShadow_1421_8491"/>
                </filter>
                <clipPath id="clip0_1421_8491">
                <rect width="10" height="10" fill="white" transform="translate(2 2)"/>
                </clipPath>
                </defs>
            </svg>
        `;
    };

    self.CreateAnnotationTemplateCriacao = function (id, entity) {
        var worldPosition = self.RightClickLastCoords;
        debugger

        try {
            
            var annotation = self.ANNOTATION_PLUGIN.createAnnotation({
                id: id,
                entity: entity,
                worldPos: worldPosition,
                occludable: true,
                markerShown: true,
                labelShown: true,

                values: {
                    idTarefaHTML: id,
                    idTarefa: 0,
                    tituloModal: 'Criar',
                    titulo: 'Adicionar título*',
                    idObra: self.IdObra,
                    idUsuario: self.IdUsuario,
                    idDocumento: entity.model.id,
                    worldPosX: worldPosition[0],
                    worldPosY: worldPosition[1],
                    worldPosZ: worldPosition[2],
                }
            });

            console.log(annotation)

            setTimeout(function () {
                self.EnableEventsForAnnotation(id);
            }, 300)

        } catch (err) {
            self.ShowErrorAlert("Ocorreu um erro ao criar uma tarefa. Tente novamente em alguns instantes. Detalhes: " + err); // Tirar o err antes de entregar
            console.log(err);
            return;
        }

        return annotation;
    };

    self.CreateAnnotationTemplateEdicao = function (x) {
        try {
            
            var id = x.Id;
            var coords = [x.WorldPos.X, x.WorldPos.Y, x.WorldPos.Z];
            var viewer = self.CUSTOM_VIEWER;
            

            viewer.camera.eye = coords;
            viewer.cameraFlight.jumpTo({
                eye: viewer.camera.eye,
                look: viewer.camera.look,
                up: viewer.camera.up
            });

            
            var annotation = self.ANNOTATION_PLUGIN.createAnnotation({
                id: x.IdTarefaHTML,
                worldPos: coords,
                occludable: true,
                markerShown: true,
                labelShown: true,

                values: {
                    idTarefaHTML: x.IdTarefaHTML,
                    idTarefa: id,
                    titulo: x.Titulo,
                    tituloModal: 'Editar',
                    idObra: self.IdObra,
                    idUsuario: self.IdUsuario,
                    idDocumento: x.IdDocumento,
                    worldPosX: x.WorldPos.X,
                    worldPosY: x.WorldPos.Y,
                    worldPosZ: x.WorldPos.Z,
                    planBadgeSVG: self.GetPlanBadgeSVG()
                }
            });

            setTimeout(function () {
                self.EnableEventsForAnnotation(x.IdTarefaHTML);
            }, 300);

        } catch (err) {
            
            self.ShowErrorAlert('Ocorreu um erro ao carregar tarefa criada.');
        }

        return annotation;
    }

    self.EnableEventsForObjectContextMenu = function (viewer, treeView, canvasContextMenu, objectContextMenu) {

        let timeoutDurationInMilliseconds = 1000;
        let timer = timeoutDurationInMilliseconds;
        let saoAndEdgesDisabled = false;

        viewer.cameraControl.on("rightClick", function (e) {
            var hit = viewer.scene.pick({
                canvasPos: e.canvasPos
            });
            
            if (hit && hit.entity.isObject) {
                self.SetRightClickLastCoords(null);
                self.SetRightClickLastCoords(hit._worldPos);

                objectContextMenu.context = { // Must set context before showing menu
                    viewer: viewer,
                    treeViewPlugin: treeView,
                    entity: hit.entity
                };

                objectContextMenu.show(e.pagePos[0], e.pagePos[1]);
            } else {
                canvasContextMenu.context = { // Must set context before showing menu
                    viewer: viewer
                };

                canvasContextMenu.show(e.pagePos[0], e.pagePos[1]);
            }
            e.event.preventDefault();

        });

        viewer.scene.camera.on("matrix", () => {
            timer = timeoutDurationInMilliseconds;
            if (!saoAndEdgesDisabled) {
                viewer.scene.sao.enabled = false;
                viewer.scene.edgeMaterial.edges = false;
                saoAndEdgesDisabled = true;
            }
        });

        viewer.scene.on("tick", (tickEvent) => {
            if (!saoAndEdgesDisabled) {
                return;
            }
            timer -= tickEvent.deltaTime;
            if (timer <= 0) {
                if (saoAndEdgesDisabled) {
                    viewer.scene.sao.enabled = true;
                    viewer.scene.edgeMaterial.edges = true;
                    saoAndEdgesDisabled = false;
                }
            }
        });

    };

    self.ShowTreeViewerVistaLoader = function () {
        $("#treeViewerVisaoCompartilhada #loaderVisaoCompartilhada").removeClass('fadeOut');
    };

    self.HideTreeViewerVistaLoader = function () {
        $("#treeViewerVisaoCompartilhada #loaderVisaoCompartilhada").addClass('fadeOut');
    };

    self.ShowViewerObjectsOnModelByIdVista = function (idVista) {
        self.ShowXktLoaderForced();
        var postData = {
            idObra: self.IdObra,
            idUsuario: self.IdUsuario,
            idVista: idVista,
            addObjectName: false
        };

        $.post(`/Vista/GetAllObjectsFromVista`, postData, function (response) {
            if (!response.Success) {
                self.ShowErrorAlert(response.Message);
                return;
            }

            if (response.Data)
                self.Visualizar3dByArrayList(response.Data);

        }).fail(function (jqXHR, textStatus, errorThrown) {

            console.log(`Erro na requisição: (${jqXHR.status}) - ${textStatus}`, errorThrown);
            self.ShowErrorAlert("Ocorreu um erro ao salvar as configurações. Por favor, tente novamente.");

        }).always(function () {
            self.HideXktLoaderForced();
        });
    };

    self.GetAnnotationMarkerIcon = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="34" viewBox="0 0 30 34" fill="none">
              <g filter="url(#filter0_bd_220_2118)">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M14.363 6C9.18537 6 4.98804 10.3925 4.98804 15.8109C4.98804 17.0311 5.40356 18.3409 5.96282 19.5791C6.53153 20.8383 7.29995 22.1331 8.11499 23.3522C9.74571 25.7915 11.6323 28.0296 12.6845 29.2255C13.5929 30.2582 15.1332 30.2582 16.0416 29.2255C17.0938 28.0296 18.9804 25.7915 20.6111 23.3522C21.4261 22.1331 22.1945 20.8383 22.7633 19.5791C23.3225 18.3409 23.738 17.0311 23.738 15.8109C23.738 10.3925 19.5407 6 14.363 6Z" fill="#666666"/>
                <path d="M14.363 5.5C8.88805 5.5 4.48804 10.138 4.48804 15.8109C4.48804 17.1348 4.93612 18.5207 5.50715 19.785C6.09117 21.078 6.87553 22.3979 7.69932 23.6301C9.34775 26.0958 11.2507 28.3528 12.3091 29.5558C13.4166 30.8147 15.3095 30.8147 16.417 29.5558C17.4754 28.3528 19.3783 26.0958 21.0268 23.6301C21.8505 22.3979 22.6349 21.078 23.2189 19.785C23.79 18.5207 24.238 17.1348 24.238 15.8109C24.238 10.138 19.838 5.5 14.363 5.5Z" stroke="white"/>
              </g>
              <defs>
                <filter id="filter0_bd_220_2118" x="0.988037" y="0" width="28.75" height="34" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                  <feGaussianBlur in="BackgroundImageFix" stdDeviation="1"/>
                  <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_220_2118"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dx="1" dy="-1"/>
                  <feGaussianBlur stdDeviation="2"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0.0862745 0 0 0 0 0.0862745 0 0 0 0 0.0862745 0 0 0 0.2 0"/>
                  <feBlend mode="normal" in2="effect1_backgroundBlur_220_2118" result="effect2_dropShadow_220_2118"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_220_2118" result="shape"/>
                </filter>
              </defs>
            </svg>
        `;
    };

    self.GetIndexHtmlModalHtml = async function (idTarefa) {
        try {
            var url = `/Tarefa/GetIndexModalHtml?token=${self.GetUrlToken()}&idObra=${self.IdObra}&idUsuario=${self.IdUsuario}&idTarefa=${idTarefa}`;

            var response = await $.post(url, null);
            if (!response.Success) {
                self.ShowErrorToastMessage('Ocorreu um erro ao recuperar o modal de visualização de tarefas. Por favor, recarregue e tente novamente, se o problema perisitir contate nosso suporte.');
                return null;
            }

            return response.Data;

        } catch (error) {
            self.ShowErrorToastMessage('Ocorreu um erro ao recuperar o modal de visualização de tarefas. Por favor, recarregue e tente novamente, se o problema perisitir contate nosso suporte.');
            return null;
        } finally {
            // Ações default, remover loader etc. Ignorar nesse caso   
        }
    }

    self.GetPersistTarefaModalHtml = async function (idTarefa) {
        try {
            var url = `/Tarefa/GetPersistTarefaModalHtml?token=${self.GetUrlToken()}&idObra=${self.IdObra}&idUsuario=${self.IdUsuario}`;
            
            if (idTarefa)
                url += `&idTarefa=${idTarefa}`;
            var response = await $.post(url, null);
            if (!response.Success) {
                self.ShowErrorToastMessage('Atenção', 'Ocorreu um erro ao recuperar o modal de criação de tarefas. Por favor, recarregue e tente novamente, se o problema perisitir contate nosso suporte.');
                return null;
            }

            return response.Data;

        } catch (error) {
            self.ShowErrorToastMessage('Atenção', 'Ocorreu um erro ao recuperar o modal de criação de tarefas. Por favor, recarregue e tente novamente, se o problema perisitir contate nosso suporte.');
            return null;
        } finally {
          // Ações default, remover loader etc. Ignorar nesse caso   
        }
    };

    self.GetAnnotationPlugin = async function (viewer) {
        if (!self.ANNOTATION_PLUGIN) {
            var templateHTML = await self.GetPersistTarefaModalHtml();
            
            if (!self.TemplateCriacaoTarefasHtml)
                self.TemplateCriacaoTarefasHtml = templateHTML;

            self.ANNOTATION_PLUGIN = new AnnotationsPlugin(viewer, {
                markerHTML: `<div class='annotation-marker' style='background-color: {{markerBGColor}};'>${self.GetAnnotationMarkerIcon()}</div>`,
                labelHTML: `${templateHTML}`,

                values: {
                    markerBGColor: "transparent",
                    glyph: "X",
                    title: "Untitled",
                    description: "No description"
                },

                // Amount to offset each Annotation from its Entity surface (0.3 is the default value).
                // This is useful when the Annotation is occludable, which is when it is hidden when occluded
                // by other objects. When occludable, there is potential for the Annotation#worldPos to become
                // visually embedded within the surface of its Entity when viewed from a distance. This happens
                // as a result of limited GPU accuracy GPU accuracy, especially when the near and far view-space clipping planes,
                // specified by Perspective#near and Perspective#far, or Ortho#near and Perspective#far, are far away from each other.
                //
                // Offsetting the Annotation may ensure that it does become visually embedded within its Entity. We may also
                // prevent this by keeping the distance between the view-space clipping planes to a minimum. In general, a good
                // default value for Perspective#far and Ortho#far is around ````2.000````.

                surfaceOffset: 0.1
            });

            // Enable events 
            self.ANNOTATION_PLUGIN.on("markerClicked", async (annotation) => {
                var id = annotation.id;
                var haveToShow = annotation.labelShown;
                if (haveToShow) {
                    self.HideAnnotationLabelById(id);
                } else {
                    if (id.length >= 15) {
                        return;
                    }
                    
                    var idTarefa = id.split('_')[1];
                    var tituloTarefa = $('#task_' + idTarefa).find('.annotation-title').html();
                    var hasToLoadModal = $('#task_' + idTarefa).find('section').length == 0;

                    self.HideAllTasks();
                    self.ShowTasksFromIdTarefa(idTarefa);

                    if (hasToLoadModal || (hasToLoadModal == false && tituloTarefa != undefined)) {

                        if (tituloTarefa != undefined) {
                            $("#" + id).html('');
                            $("#" + id).css('opacity', 0);
                        }
                        
                        self.ShowAnnotationLabelById(id);
                        var annotationPinMarker = $(annotation._marker);
                        var tarefaPrivadaBadge = $(annotationPinMarker).find('.private-task-area');
                        var markerElement = $('#task_' + idTarefa).prev(".annotation-marker")[0];
                        var svgActualColor = self.GetSvgColor(markerElement);
                        var loaderIcon = `<i style="font-size: 20px; color: ${svgActualColor};" class="fas fa-circle-notch fa-spin"></i>`;

                        $(annotationPinMarker).html('');
                        $(annotationPinMarker).html(loaderIcon);

                        var html = await self.GetIndexHtmlModalHtml(idTarefa);
                        var teste = $(html).html();

                        $("#" + id).html(teste);
                        $("#" + id).css('opacity', 1);
                        
                        setTimeout(function () {
                            self.EnableEventsForAnnotationIndex(id);
                            $(annotationPinMarker).html(self.GetAnnotationMarkerIcon(svgActualColor));
                            if (tarefaPrivadaBadge != null && tarefaPrivadaBadge != undefined && tarefaPrivadaBadge.length > 0) {
                                self.SetTarefaPrivadaBadgeOnMarker(annotationPinMarker, true);
                            }
                        }, 10);

                    } else {
                        self.ShowAnnotationLabelById(id);
                    }
                    
                }
            });

            // Aqui é a prte de criar tarefas com atalho. Quando voltar o ticket ficou faltando só conseguir mudar o cursor e
            // conseguir cancelar o listener dentro do viewer: viewer.scene.input.off("mouseclicked") // nao funciona
            //document.addEventListener("keydown", function (event) {
            //    if (event.key.toUpperCase() === "T") {
            //        event.preventDefault(); 

            //        document.body.style.cursor = "crosshair";
                    
            //        viewer.scene.input.on("mouseclicked", (coords) => {
            //            var pickResult = viewer.scene.pick({
            //                canvasPos: coords,
            //                pickSurface: true 
            //            });

            //            if (pickResult) {
            //                var id = self.GenerateUniqueTaksId();
            //                var entity = pickResult.entity;
            //                self.RightClickLastCoords = pickResult._worldPos;

            //                self.CreateAnnotationTemplateCriacao(id, entity);
                            
            //                viewer.scene.input.off("mouseclicked");
            //            }
            //        });
                    
            //    }
            //});
        }

        window.viewer = viewer;
    };

    self.HideAnnotationLabelById = function (id) {
        $("#" + id).hide();
    };

    self.ShowAnnotationLabelById = function (id) {
        $("#" + id).show();
    };

    self.ShowTreeViewerVistaLoader = function () {
        $("#treeViewerVisaoCompartilhada #loaderVisaoCompartilhada").removeClass('fadeOut');
    };

    self.HideTreeViewerVistaLoader = function () {
        $("#treeViewerVisaoCompartilhada #loaderVisaoCompartilhada").addClass('fadeOut');
    };

    self.ShowViewerObjectsOnModelByIdVista = function (idVista) {
        self.ShowXktLoaderForced();
        var postData = {
            idObra: self.IdObra,
            idUsuario: self.IdUsuario,
            idVista: idVista,
            addObjectName: false
        };

        $.post(`/Vista/GetAllObjectsFromVista`, postData, function (response) {
            if (!response.Success) {
                self.ShowErrorAlert(response.Message);
                return;
            }

            if (response.Data)
                self.Visualizar3dByArrayList(response.Data);

        }).fail(function (jqXHR, textStatus, errorThrown) {

            console.log(`Erro na requisição: (${jqXHR.status}) - ${textStatus}`, errorThrown);
            self.ShowErrorAlert("Ocorreu um erro ao recuperar as informações de vista. Por favor, tente novamente.");

        }).always(function () {
            self.HideXktLoaderForced();
        });
    };

    self.GetAnnotationMarkerIcon = function (svgColor) {
        
        if (!svgColor) {
            svgColor = "#666666";
        }

        return `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="34" viewBox="0 0 30 34" fill="none">
          <g filter="url(#filter0_bd_220_2118)">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M14.363 6C9.18537 6 4.98804 10.3925 4.98804 15.8109C4.98804 17.0311 5.40356 18.3409 5.96282 19.5791C6.53153 20.8383 7.29995 22.1331 8.11499 23.3522C9.74571 25.7915 11.6323 28.0296 12.6845 29.2255C13.5929 30.2582 15.1332 30.2582 16.0416 29.2255C17.0938 28.0296 18.9804 25.7915 20.6111 23.3522C21.4261 22.1331 22.1945 20.8383 22.7633 19.5791C23.3225 18.3409 23.738 17.0311 23.738 15.8109C23.738 10.3925 19.5407 6 14.363 6Z" fill="${svgColor}"/>
            <path d="M14.363 5.5C8.88805 5.5 4.48804 10.138 4.48804 15.8109C4.48804 17.1348 4.93612 18.5207 5.50715 19.785C6.09117 21.078 6.87553 22.3979 7.69932 23.6301C9.34775 26.0958 11.2507 28.3528 12.3091 29.5558C13.4166 30.8147 15.3095 30.8147 16.417 29.5558C17.4754 28.3528 19.3783 26.0958 21.0268 23.6301C21.8505 22.3979 22.6349 21.078 23.2189 19.785C23.79 18.5207 24.238 17.1348 24.238 15.8109C24.238 10.138 19.838 5.5 14.363 5.5Z" stroke="white"/>
          </g>
          <defs>
            <filter id="filter0_bd_220_2118" x="0.988037" y="0" width="28.75" height="34" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
              <feGaussianBlur in="BackgroundImageFix" stdDeviation="1"/>
              <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_220_2118"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="1" dy="-1"/>
              <feGaussianBlur stdDeviation="2"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.0862745 0 0 0 0 0.0862745 0 0 0 0 0.0862745 0 0 0 0.2 0"/>
              <feBlend mode="normal" in2="effect1_backgroundBlur_220_2118" result="effect2_dropShadow_220_2118"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_220_2118" result="shape"/>
            </filter>
          </defs>
        </svg>
    `;
    };

    self.GetRandomInt = function (min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    self.HideAnnotationLabelById = function (id) {
        $("#" + id).hide();
    };

    self.ShowAnnotationLabelById = function (id) {
        $("#" + id).show();
    };

    self.ShowTreeViewerVistaLoader = function () {
        $("#treeViewerVisaoCompartilhada #loaderVisaoCompartilhada").removeClass('fadeOut');
    };

    self.HideTreeViewerVistaLoader = function () {
        $("#treeViewerVisaoCompartilhada #loaderVisaoCompartilhada").addClass('fadeOut');
    };

    self.GetAllVistasModalHtml = async function () {

        self.ShowTreeViewerVistaLoader();

        setTimeout(function () {
            var postData = {
                idObra: self.IdObra,
                idUsuario: self.IdUsuario,
                chaveCompartilhamento: self.ChaveCompartilhamento
            };

            $.post(`/Vista/GetAllVistasModalHtml`, postData, function (response) {
                if (!response.Success) {
                    self.ShowErrorAlert(response.Message);
                    return;
                }

                $("#treeViewerVisaoCompartilhada").html(``);
                $("#treeViewerVisaoCompartilhada").html(response.Data);
                self.EnableBootstrapTooltipForClass('#listAllVistaArea .radio-container .radio-option .buttons-box span');
                self.EnableRadioClickEvent();
                if (self._trazerVistaSelecionada && self._idVistaSelecionadaPadrao > 0) {
                    setTimeout(function () {
                        var idVista = self._idVistaSelecionadaPadrao;
                        $("#option_" + idVista).find("input").prop("checked", true);
                        self.ShowViewerObjectsOnModelByIdVista(idVista);
                    }, 100);
                }

            }).fail(function (jqXHR, textStatus, errorThrown) {

                console.log(`Erro na requisição: (${jqXHR.status}) - ${textStatus}`, errorThrown);
                self.ShowErrorAlert("Ocorreu um erro ao recuperar as configurações de vista. Por favor, tente novamente.");

            }).always(function () {
                self.HideTreeViewerVistaLoader();
            }, 1500);
        })
    };

    self.ShowViewerObjectsOnModelByIdVista = function (idVista) {
        self.ShowXktLoaderForced();
        var postData = {
            idObra: self.IdObra,
            idUsuario: self.IdUsuario,
            idVista: idVista,
            addObjectName: false
        };

        $.post(`/Vista/GetAllObjectsFromVista`, postData, function (response) {
            if (!response.Success) {
                self.ShowErrorAlert(response.Message);
                return;
            }

            if (response.Data)
                self.Visualizar3dByArrayList(response.Data);

        }).fail(function (jqXHR, textStatus, errorThrown) {

            console.log(`Erro na requisição: (${jqXHR.status}) - ${textStatus}`, errorThrown);
            self.ShowErrorAlert("Ocorreu um erro ao recuperar as informações de vista. Por favor, tente novamente.");

        }).always(function () {
            self.HideXktLoaderForced();
        });
    };

    self.HasToShowConfirmationModal = function (plantasEnvolvidas, plantasProcessadas) {
        if (!plantasEnvolvidas || !plantasProcessadas || !Array.isArray(plantasProcessadas)) {
            return false;
        }
        var envolvidas = plantasEnvolvidas.split(',').map(Number);
        for (const planta of envolvidas) {
            if (!plantasProcessadas.includes(planta)) {
                return true;
            }
        }
        return false;
    };

    self.EnableRadioClickEvent = function () {
        $('#listAllVistaArea .radio-option input[type="radio"]').on('change', function () {
            var element = $(this).parent().attr("id");
            var elementId = element.split('_')[1];
            var idsPlantasEnvolvidas = String($(this).parent().data("plantas-envolvidas"));
            var chaveCompartilhamento = $(this).parent().data("chave-compartilhamento");
            var idsPlantasProcessadas = self._IdsPlantasProcessadas;
            var hasToShowModalConfirmacao = self.HasToShowConfirmationModal(idsPlantasEnvolvidas, idsPlantasProcessadas);
            
            if (hasToShowModalConfirmacao) {
                var okCallBack = function () {
                    
                    self.ReloadWindowWithNewURLVisaoCompartilhada(chaveCompartilhamento);
                };

                var cancelCallBack = function () {
                    self.ShowViewerObjectsOnModelByIdVista(elementId);
                };

                self.ShowConfirmationModal('', 'Alguns documentos da visão compartilhada não foram federados. Deseja federar para ter a visualização completa?', okCallBack, cancelCallBack);

            } else {
                self.ShowViewerObjectsOnModelByIdVista(elementId);
            }
        });
    };

    self.ShowTreeViewerVisaoCompartilhada = function () {
        document.querySelector('#treeViewerVisaoCompartilhada').parentElement.classList.remove('hidden');
        $("#treeViewerVisaoCompartilhada").css('opacity', '1');
        setTimeout(async function () {
            await self.GetAllVistasModalHtml();
        }, 1000);
    };

    self.ShowTreeViewer = function () {
        document.querySelector('#treeViewer').parentElement.classList.remove('hidden');
        $("#treeViewer").css('opacity', '1');

        self.EnableBootstrapTooltipForClass('.selecionarTodosButton');
    };

    self.EnableBootstrapTooltipForClass = function (className) {
        var elements = document.querySelectorAll(className);
        elements.forEach(function (element) {
            new bootstrap.Tooltip(element, {
                trigger: 'hover'
            });
        });
    };

    self.DisableBootstrapTooltipForClass = function (className) {
        var elements = document.querySelectorAll(className);
        elements.forEach(function (element) {
            var tooltipInstance = bootstrap.Tooltip.getInstance(element);
            if (tooltipInstance) {
                tooltipInstance.dispose();
            }
        });
    };

    self.EnableBootstrapTooltip = function () {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, {
                trigger: 'hover'
            })
        })
    };

    self.HideTreeViewerVisaoCompartilhada = function () {
        $("#treeViewerVisaoCompartilhada").html(` <div id="loaderVisaoCompartilhada">
                            <div class="spinner"></div>
                        </div>`);
        document.querySelector('#treeViewerVisaoCompartilhada').parentElement.classList.add('hidden');
        $("#treeViewerVisaoCompartilhada").css('opacity', '0');
    };

    self.HideTreeViewer = function () {
        document.querySelector('#treeViewer').parentElement.classList.add('hidden');
        $("#treeViewer").css('opacity', '0');
    };

    self.EnableGeneralEventsForView = function (distanceMeasurements, sectionPlanes, viewer, treeView) {

        let sectionPlane = null;
        let sectionPlaneLastConfig = {
            pos: [1.04, 1.95, 9.74],
            dir: [1.0, 0.0, 0.0],
        }

        document.querySelector('#ruler_button').addEventListener('click', (event) => {
            let element = event.target;
            if (element.nodeName == 'svg')
                element = element.parentElement;

            if (distanceMeasurements.control.active) {
                document.querySelector('#ruler_button').classList.remove('active')
                distanceMeasurements.control.deactivate()
                self.DISTANCE_MEASUREMENTS.clear();
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616")
            } else {
                document.querySelector('#ruler_button').classList.add('active')
                distanceMeasurements.control.activate()
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#fff")
            }
        });

        document.querySelector('#tree_button').addEventListener('click', (event) => {
            let element = event.target;
            if (element.nodeName == 'svg')
                element = element.parentElement;

            if (!element.classList.contains('active')) {
                element.classList.add('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#fff");
                var hasToHideTreeViewer = $('#visao_compartilhada_button').hasClass('active');
                if (hasToHideTreeViewer) {

                    $('#visao_compartilhada_button').click();
                }

                self.ShowTreeViewer();


            } else {
                element.classList.remove('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616")
                document.querySelector('#treeViewer').parentElement.classList.add('hidden');
                self.HideTreeViewer();
            }
        });

        document.querySelector('#visao_compartilhada_button').addEventListener('click', (event) => {
            let element = event.target;
            if (element.nodeName == 'svg')
                element = element.parentElement;

            if (!element.classList.contains('active')) {
                element.classList.add('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#fff");

                var hasToHideTreeViewer = $('#tree_button').hasClass('active');
                if (hasToHideTreeViewer) {
                    $('#tree_button').click();
                }
                self.ShowTreeViewerVisaoCompartilhada();


            } else {
                element.classList.remove('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616")
                document.querySelector('#treeViewerVisaoCompartilhada').parentElement.classList.add('hidden');
                self.HideTreeViewerVisaoCompartilhada();
            }
        });

        document.querySelector('#panel_button').addEventListener('click', (event) => {
            let element = event.target;
            if (element.nodeName == 'svg')
                element = element.parentElement;

            const navButton = document.querySelector('#cube_button');

            if (element.classList.contains('active')) {
                element.classList.remove('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616")
                document.querySelector('#mySectionPlanesOverviewCanvas').classList.add('hidden');

                if (sectionPlane) {
                    sectionPlaneLastConfig = {
                        pos: sectionPlane.pos,
                        dir: sectionPlane.dir,
                    }

                    sectionPlane.destroy();
                    sectionPlane = null;
                }

                sectionPlanes.hideControl();
            } else {
                element.classList.add('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#fff")
                document.querySelector('#mySectionPlanesOverviewCanvas').classList.remove('hidden');

                if (!sectionPlane) {
                    sectionPlane = sectionPlanes.createSectionPlane({
                        id: Math.random().toString(36).substring(7),
                        active: true,
                        ...sectionPlaneLastConfig
                    });
                } else {
                    sectionPlane.active = true;
                }

                sectionPlanes.showControl(sectionPlane.id);

                navButton.classList.remove('active');
                var svgElement = $(navButton).find('svg').find('path')
                $(svgElement).attr("fill", "#161616")
                document.querySelector('#myNavCubeCanvas').classList.add('hidden');
            }
        });

        document.querySelector('#cube_button').addEventListener('click', (event) => {
            let element = event.target;
            if (element.nodeName == 'svg')
                element = element.parentElement;

            const panelButton = document.querySelector('#panel_button');

            if (!element.classList.contains('active')) {
                element.classList.add('active');
                document.querySelector('#myNavCubeCanvas').classList.remove('hidden');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#fff");

                panelButton.classList.remove('active');
                document.querySelector('#mySectionPlanesOverviewCanvas').classList.add('hidden');
                var svgElement = $(panelButton).find('svg').find('path')
                $(svgElement).attr("fill", "#161616")


                if (sectionPlane) {
                    sectionPlaneLastConfig = {
                        pos: sectionPlane.pos,
                        dir: sectionPlane.dir,
                    }

                    sectionPlane.destroy();
                }
                sectionPlanes.hideControl();

            } else {
                element.classList.remove('active');
                document.querySelector('#myNavCubeCanvas').classList.add('hidden');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616")
            }
        });

        document.querySelector('#home_button').addEventListener('click', (event) => {
            let element = event.target;
            if (element.nodeName == 'svg')
                element = element.parentElement;
            else {
                if (element.nodeName == 'path') {
                    element = element.parentElement.parentElement;
                }
            }

            if (element.classList.contains('active')) {
                element.classList.remove('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616");
            } else {
                element.classList.add('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#Fff");
                self.CUSTOM_VIEWER.cameraFlight.flyTo({
                    duration: 1.0,
                    aabb: self.CUSTOM_VIEWER.scene.getAABB()
                });
            }
        });

        document.querySelector('#perspective_button').addEventListener('click', (event) => {
            let element = event.target;
            if (element.nodeName == 'svg')
                element = element.parentElement;

            if (!element.classList.contains('active')) {
                element.classList.add('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#fff");
                viewer.cameraFlight.flyTo({
                    projection: 'ortho',
                    duration: 1.0,
                    aabb: viewer.scene.getAABB(),
                });
            } else {
                element.classList.remove('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616");
                viewer.cameraFlight.flyTo({
                    projection: 'perspective',
                    duration: 1.0,
                    aabb: viewer.scene.getAABB()
                })
            }
        });

        document.querySelector('#details_button').addEventListener('click', (event) => {
            const isCubeButtonActive = document.querySelector('#cube_button').classList.contains('active');
            if (isCubeButtonActive) {
                document.querySelector('#cube_button').click();
            }

            let element = event.target;
            if (element.nodeName == 'svg')
                element = element.parentElement;

            if (element.classList.contains('active')) {

                if (!self._ActiveObject) {
                    self._ActiveObject = viewer.metaScene.metaObjects ?
                        Object.values(viewer.metaScene.metaObjects)?.filter(item => !item.parent)?.at(0)?.id
                        : null;
                }

                self.RenderDetails(self._ActiveObject);
                element.classList.remove('active');
                document.querySelector('#detailsViewer').classList.add('hidden');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616");

            } else {
                element.classList.add('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#fff");
                document.querySelector('#detailsViewer').classList.remove('hidden');
                var notFoundHtml = self.GetNotFoundPropertyHtml();
                var headerHtml = self.GetDetailsHeader(true);
                $('#detailsViewer').html(notFoundHtml);
                $("#detailsViewer").prepend(headerHtml);
                self.EnableEventsForDetails();
            }
        });

        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('handle-li')) {
                const isActive = event.target.classList.contains('active');
                const parent = event.target.parentElement;

                if (isActive) {
                    parent.querySelectorAll('li:not(:first-child)').forEach((element) => {
                        element.classList.add('hidden');
                    });

                    return event.target.classList.remove('active');
                }
                parent.querySelectorAll('li:not(:first-child)').forEach((element) => {
                    element.classList.remove('hidden');
                });

                return event.target.classList.add('active');
            }
        });

        document.querySelector('#filter_button').addEventListener('click', (event) => {
            let element = event.target;
            if (element.nodeName == 'svg')
                element = element.parentElement;
            else {
                if (element.nodeName == 'path') {
                    element = element.parentElement.parentElement;
                }
            }

            if (element.classList.contains('active')) {
                element.classList.remove('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616")
            } else {
                element.classList.add('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#fff")
                self.OpenFilterByColumnsModal();
            }
        });

        document.querySelector('#fullscreen_button').addEventListener('click', () => {
            self.ToggleFullScreen();
        });

        document.addEventListener("keydown", e => {
            // disable full screen by f11 (problems with chrome security)
            if (e.key == "F11") e.preventDefault();
        });
    };

    self.RestartBimViewerModelsState = function () {
        const viewer = self.CUSTOM_VIEWER;
        const modelIds = Object.keys(viewer.scene.objects);
        const idsSet = new Set();
        for (let i = 0; i < modelIds.length; i++) {
            const id = modelIds[i];
            const sceneModel = viewer.scene.objects[id];
            if (sceneModel && sceneModel.model && sceneModel.model.id) {
                idsSet.add(sceneModel.model.id);
            }
        }

        // Limpar objetos da cena
        const ids = Array.from(idsSet);
        ids.forEach(id => {
            const sceneModel = viewer.scene.models[id];
            const metaModel = viewer.metaScene.metaModels[id];
            if (sceneModel && typeof sceneModel.destroy === 'function') {
                sceneModel.destroy();
            }

        });

        // Limpar a cena
        self._AllObjectMetaDataCache = null;
    };

    self.GetTemplateEdicaoPreviewHtml = function () {
        var html = "<div id='{{idTarefaHTML}}' data-idplanta-on-marker-label='{{idDocumento}}' class='annotation-area' style='opacity: 0;'></div>";
        return html;
    };

    self.ProccessModels = async function (models, xktLoader, treeView, viewer) {
        let arrayWitthoutEmptyURL = models.filter(x => x.url !== null && x.url !== '');
        self._modelsArrayLength = arrayWitthoutEmptyURL.length;
        
        // var operationResult = await self.GetAllObraTarefasAsync();
        // var dadosArmazenados = operationResult.Data;
        var dadosArmazenados = "";
        models.forEach((modelObject, index, array) => {
            const model = xktLoader.load({
                id: modelObject.planta_id,
                src: modelObject.url,
                edges: true,
                backfaces: true,
                markerCustomColorByPlantaStatus: modelObject.MarkerCustomColorByPlantaStatus
            });

            model.on("loaded", async () => {
                self._modelsAlreadyLoadedCount++;

                treeView.addModel(model.id, {
                    rootName: modelObject.type + '**' + model.id,
                });

                viewer.cameraFlight.flyTo({
                    duration: 1.0,
                    aabb: viewer.scene.getAABB()
                });

                var objectId = model.id;
                var metaObject = viewer.metaScene.metaModels[objectId];
                if (metaObject) {
                    metaObject.customProperty = {
                        "NomeDocumento": modelObject.type, // type = nome publico planta
                        "MarkerCustomColorByPlantaStatus": metaObject.MarkerCustomColorByPlantaStatus,
                    };
                }

                let alreadyActive = $("#cube_button").hasClass("active");
                if (!alreadyActive) $("#cube_button").click();

                let idPlanta = self.GetActivePlantaId();
                if (model.id === idPlanta) {
                    self._selectedModel = model;
                }

                if (dadosArmazenados) {
                    debugger
                    // Essa parte é importante, pra funcionar corretamente precisa alterar o template (para o de edição) na hora de carregar somente os pins com as coordenadas
                    var allTasksFromDoc = dadosArmazenados.filter(x => x.IdDocumento == model.id);
                    if (allTasksFromDoc && allTasksFromDoc.length > 0) {
                        var newHtml = self.GetTemplateEdicaoPreviewHtml();
                        self.ANNOTATION_PLUGIN._labelHTML = newHtml;
                        self.SetTarefasOn3dModel(allTasksFromDoc);
                    }

                    // Ao terminar precisa voltar o template de criação de novo para ficar correto ao criar novas tarefas
                    if (allTasksFromDoc && allTasksFromDoc.length > 0) {
                        self.ANNOTATION_PLUGIN._labelHTML = self.TemplateCriacaoTarefasHtml;
                    }
                }
               
                let isLastInteration = self._modelsAlreadyLoadedCount === self._modelsArrayLength;
                if (isLastInteration) {
                    setTimeout(() => {
                        self.CustomizeViewerCanvasHtml();
                        
                        _bimSdkModule = bimSdkModule;
                    }, 1500);
                }
                
                self._IdsPlantasProcessadas.push(objectId);
            });
        });
    };

    self.SetTarefasOn3dModel = function (dadosArmazenados) {
        dadosArmazenados.forEach(function (x) {
            self.CreateAnnotationTemplateEdicao(x);
            setTimeout(function () {
                $("#" + x.IdTarefaHTML).hide();
                
                var markerElement = $("#" + x.IdTarefaHTML).prev(".annotation-marker")[0];
                self.ChangeSVGColor(markerElement, x.MarkerCustomColorByPlantaStatus);
                self.SetTarefaPrivadaBadgeOnMarker(markerElement, x.IsPrivada);
            }, 300);
        });
    };

    self.ChangeSVGColor = function (htmlElement, svgColor) {
        if (htmlElement) {
            const svgElement = htmlElement.querySelector("svg path:first-of-type");
            if (svgElement) svgElement.setAttribute("fill", svgColor);
        }
    };

    self.GetSvgColor = function (htmlElement) {
        if (htmlElement) {
            const svgElement = htmlElement.querySelector("svg path:first-of-type");

            if (svgElement) {
                return svgElement.getAttribute("fill") || "none";
            } else {
                return "#666"; 
            }
        } else {
            return "#666";
        }
    };

    self.SetAllTarefasFromDocsOn3dModel = async function () {
        var operationResult = await self.GetAllObraTarefasAsync(self.idPlanta);
        if (!operationResult.Success) {
            self.ShowWarningAlert(operationResult.Message);
            return;
        }

        var dadosArmazenados = operationResult.Data;
        if (dadosArmazenados && dadosArmazenados.length > 0) {
            dadosArmazenados.forEach(function (x) {

                self.CreateAnnotationTemplateEdicao(x);
                
                setTimeout(function () {
                    $("#" + x.IdTarefaHTML).hide();
                }, 300);
            });
        }
    };

    self.ResetViewerOriginalPosition = function () {
        var viewer = self.CUSTOM_VIEWER;
        viewer.camera.eye = [-3.933, 2.855, 27.018];
        viewer.camera.look = [4.400, 3.724, 8.899];
        viewer.camera.up = [-0.018, 0.999, 0.039];
        viewer.cameraFlight.flyTo({
            eye: viewer.camera.eye,
            look: viewer.camera.look,
            up: viewer.camera.up
        });

        var aabb = viewer.scene.aabb;
        viewer.cameraFlight.flyTo(aabb);
    };
    // --------------------------------
    //  General methods
    // --------------------------------

    self.GetFederarDocumentosIcon = function (color) {
        if (!color)
            color = "#161616";

        return `
            <svg style="margin-right: 4px;" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.6666 4.66667C11.6666 4.51196 11.6051 4.36359 11.4957 4.25419L8.57906 1.33753C8.46967 1.22813 8.32129 1.16667 8.16658 1.16667L3.49992 1.16667C2.85559 1.16667 2.33325 1.68901 2.33325 2.33334L2.33325 7.00001H3.49992L3.49992 2.33334L7.58325 2.33334V5.25001H10.4999L10.4999 7.00001H11.6666V4.66667ZM8.74992 3.1583V4.08334H9.67496L8.74992 3.1583Z" fill="${color}"/>
                <path d="M11.6666 9.33334L2.33325 9.33334L2.33325 8.16667L11.6666 8.16667V9.33334Z" fill="${color}"/>
                <path d="M11.6666 11.0833H2.33325L2.33325 9.91667L11.6666 9.91667V11.0833Z" fill="${color}"/>
                <path d="M11.6666 12.8333H2.33325L2.33325 11.6667H11.6666V12.8333Z" fill="${color}"/>
            </svg>
        `;
    };

    self.EnableEventsForCanvasCustomization = function () {
        document.querySelector('#federar_button').addEventListener('click', async (event) => {
            let element = event.target;

            if (element.classList.contains('disabled')) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            if (element.classList.contains('mdi')) {
                element = element.parentElement;
            }

            if (element.classList.contains('active')) {
                element.classList.remove('active');
            } else {
                element.classList.add('active');
                await self.OpenFederarArquivosModal();
            }
        });

        document.querySelectorAll('[data-toggle="treeview"]').forEach((button) => {
            button.addEventListener('click', (event) => {
                self.TREE_VIEW_PLUGIN.hierarchy = event.target.dataset.hierarchy;

                document.querySelectorAll('[data-toggle="treeview"]').forEach((element) => {
                    element.classList.remove('active');
                });

                event.target.classList.add('active');
            });
        });

        $('.categoriasModelosPavimentosArea .listaStoreys li button').on("click", function (e) {
            self.MoveAttrDataIdPlantaFromDocNameToHtmlParam();
            self.EnableEventsForCheckboxClickOnTreeviewer();
        })
    };

    self.GetHtmlTreeviewer = function () {

        var disableElement = _hasToDisableFederarButton == "true" ? "disabled" : "";
        var tooltip = (disableElement) ? 'data-bs-placement="bottom" data-bs-toggle="tooltip" title="Não existem outros documentos para federar"' : '';
        return `
                           <div class="federarArquivosSection">
                                <span id="federar_button" class="${disableElement}" alt="Federar documentos" ${tooltip}>
                                    ${self.GetFederarDocumentosIcon()} Federar documentos
                                </span>
                                <div class='selecionarTodosSection' >
                                    <button class="action-button selecionarTodosButton" onclick="return _mainModel.SelectAllDocsFromTreeViewer(this)" data-bs-placement="bottom" data-bs-toggle="tooltip" title="Selecionar tudo" style="margin-right: 8px;" >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                                            <path d="M11.0833 2.75H5.25C4.6318 2.75 4.12591 3.23082 4.08589 3.83889H11.1611V10.9141C11.7692 10.8741 12.25 10.3682 12.25 9.75V3.91667C12.25 3.27234 11.7277 2.75 11.0833 2.75Z" fill="#161616"/>
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.41667 9.75V11.0722H5.25V9.75H3.92778V8.58333H5.25V7.26111H6.41667V8.58333H7.73889V9.75H6.41667ZM2.91667 12.0833H8.75V6.25H2.91667V12.0833ZM8.75 13.25C9.39433 13.25 9.91667 12.7277 9.91667 12.0833V6.25C9.91667 5.60567 9.39433 5.08333 8.75 5.08333H2.91667C2.27234 5.08333 1.75 5.60567 1.75 6.25V12.0833C1.75 12.7277 2.27234 13.25 2.91667 13.25H8.75Z" fill="#161616"/>
                                        </svg>
                                    </button>
                                    <button class="action-button selecionarTodosButton" onclick="return _mainModel.UnSelectAllDocsFromTreeViewer(this)" data-bs-placement="bottom" data-bs-toggle="tooltip" title="Desmarcar tudo" style="" >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                                        <path d="M11.0833 2.75H5.25C4.6318 2.75 4.12591 3.23082 4.08588 3.83889H11.1611V10.9141C11.7692 10.8741 12.25 10.3682 12.25 9.75V3.91667C12.25 3.27233 11.7277 2.75 11.0833 2.75Z" fill="#161616"/>
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M2.91667 12.0833H8.75V6.25H2.91667V12.0833ZM8.75 13.25C9.39433 13.25 9.91667 12.7277 9.91667 12.0833V6.25C9.91667 5.60567 9.39433 5.08333 8.75 5.08333H2.91667C2.27233 5.08333 1.75 5.60567 1.75 6.25V12.0833C1.75 12.7277 2.27233 13.25 2.91667 13.25H8.75Z" fill="#161616"/>
                                        <path d="M4.08333 8.58333H7.58333V9.75H4.08333V8.58333Z" fill="#161616"/>
                                    </svg>
                                    </button>
                                </div>
                            </div>
                        `;
    };

    self.GetAllObraTarefasAsync = async function (idModel) {
        // AQUI
        var _response = self.GetAllTarefasAsyncResponseExample();
        // var url = '';
        // if (idModel)
        //     url = `/Tarefa/GetAllTarefasAsync?token=${self.GetUrlToken()}&idObra=${self.IdObra}&idDocumento=${idModel}`;
        // else
        //     url = `/Tarefa/GetAllTarefasAsync?token=${self.GetUrlToken()}&idObra=${self.IdObra}`;

        // $.ajax({
        //     url: url,
        //     type: 'POST',
        //     async: false,
        //     success: function (response) {
                
        //         _response = response;
        //     },
        //     error: function (xhr, status, error) {
        //         self.ShowErrorAlert("Erro ao recuperar tarefas. Tente novamente e se o erro continuar, por favor, reporte um issue");
        //     }
        // });
        return _response;
    };

    self.GetAllTarefasCoordsByIdObra = async function () {
        var _response = null;
        $.ajax({
            url: `/Tarefa/GetAllTarefasCoordsByIdObraAsync?token=${self.GetUrlToken()}&idObra=${self.IdObra}`,
            type: 'POST',
            async: false,
            success: function (response) {
                if (response.Success == false) {
                    self.ShowErrorAlert("Erro ao recuperar coordenadas das tarefas. Tente novamente e se o erro continuar, por favor, reporte um issue");
                }

                _response = response;
            },
            error: function (xhr, status, error) {
                self.ShowErrorAlert("Erro ao recuperar coordenadas das tarefas. Tente novamente e se o erro continuar, por favor, reporte um issue");
            }
        });
        return _response;
    };

    self.MoveAttrDataIdPlantaFromDocNameToHtmlParam = function () {
        $('#treeViewer ul:not(.listaStoreys)').each(function (i, element) {
            var $this = $(element);
            var elementText = $this.find('li:first-child span').text().trim();
            if (elementText) {
                var splitedElement = elementText.split("**");
                var arraySize = splitedElement.length - 1;
                var idPlanta = splitedElement[arraySize];
                var nomeDocumento = splitedElement[0];
                $this.find('li:first-child span').text(nomeDocumento)
                var liElement = $this.find('li:first-child');
                $(liElement).attr("data-idPlanta", idPlanta);
            }
        });
    };

    self.EnableEventsForCheckboxClickOnTreeviewer = function () {
        $('#treeViewer ul li input[type="checkbox"]').on('click', function (e) {
            var idPlanta = $(e.currentTarget).parent().data('idplanta');
            if (idPlanta) {
                self.HideAllTasks();
                var allCheckBoxes = $('#treeViewer > ul > li > input[type="checkbox"]:checked');
                if (allCheckBoxes && allCheckBoxes.length) {
                    allCheckBoxes.each(function (id, element) {
                        var idPlanta = $(element).parent().data('idplanta');
                        if(idPlanta)
                            self.ShowTasksFromIdPlanta(idPlanta);
                    });
                }
            }
        });
    };

    self.CustomizeViewerCanvasHtml = function () {
        // Remove o blur do treeviewer
        $('.absolute.h-28.top-3.left-3.w-96.backdrop-blur-sm.rounded-s-xl.z-30').remove()

        // Área de federar documentos e selecionar todos
        var html = self.GetHtmlTreeviewer();
        $('#treeViewer').prepend(html);

        // Área de categorias, modelos, pavimentos
        var clonedElement = $('#treeViewer').parent().find('ul:first-child').clone(true);
        clonedElement.removeClass();
        clonedElement.addClass('listaStoreys');
        var wrappedHtml = $('<div class="categoriasModelosPavimentosArea"></div>').html(clonedElement);
        $('#treeViewer').parent().find('ul:first-child').remove();
        $('.federarArquivosSection').after(wrappedHtml);
        self.MoveAttrDataIdPlantaFromDocNameToHtmlParam();
        self.MoveAttrStyleToClassByTreeviewer(clonedElement);

        self.EnableEventsForCanvasCustomization();

        setTimeout(function () {
            self.RealizaChamadaParaAtivarCacheDisciplinas();

            self.ResetViewerOriginalPosition();

            self.HideLoader();

            if (self._trazerVistaSelecionada && self._idVistaSelecionadaPadrao > 0) {
                $("#visao_compartilhada_button").click();
            }

            self.EnableEventsForCheckboxClickOnTreeviewer();

            if (self._chaveCompartilhamentoNaoEncontrada) {
                self.ShowInfoToastMessage("Erro ao acessar a visão compartilhada!", "Parece que essa visão não está mais disponível.")
                return;
            }

        }, 1500);
    };

    self.MoveAttrStyleToClassByTreeviewer = function (treeViewerCloned) {
        if (!treeViewerCloned) {
            var style = $(treeViewerCloned).attr("style").text();
            style += " z-index: 999999999999999999;"
            $(treeViewerCloned).attr("style", style);
        }
    };

    self.SelectAllDocsFromTreeViewer = function (elmnt) {
        $("#treeViewer ul > li > input").each(function (index, element) {
            if (!element.checked)
                $(element).click();
        });
    };

    self.UnSelectAllDocsFromTreeViewer = function (elmnt) {
        $("#treeViewer ul > li > input").each(function (index, element) {
            if (element.checked)
                $(element).click();
        });
    };

    self.GetMetaDataFromObject = function (objectId) {
        return self.CUSTOM_VIEWER.metaScene.metaObjects[objectId];
    };

    self.GetObjectTypeFromMetaData = function (objectId) {
        var metadata = self.CUSTOM_VIEWER.metaScene.metaObjects[objectId];
        return metadata.type;
    };

    self.ReturnAllObjectsTypes = function () {
        var objects = self.CUSTOM_VIEWER.scene.objects;
        var allTypes = new Set();

        for (var objectId in objects) {
            var objectType = self.GetObjectTypeFromMetaData(objectId);
            allTypes.add(objectType);
        }

        return Array.from(allTypes);
    };

    self.FilterView = function () {
        var viewer = self.CUSTOM_VIEWER;
        var typesToFilter = ['IfcColumn'];
        var objects = viewer.scene.objects;
        var filteredIds = [];

        for (var objectId in objects) {
            var object = objects[objectId];
            var objectType = self.GetObjectTypeFromMetaData(objectId);
            var objectMetaData = self.GetMetaDataFromObject(objectId);

            // Verifica se o objeto é do tipo desejado e adiciona seu ID ao array
            if (typesToFilter.includes(objectType)) {
                filteredIds.push(objectId);
            }
        }

        if (filteredIds.length > 0) {
            self.UnselectAll(viewer);
            viewer.scene.setObjectsVisible(filteredIds, true)
        }
    };

    self.GetUrlParamValue = function (param) {
        return new URLSearchParams(window.location.search).getAll(param);
    };

    self.GetActivePlantaId = function () {
        return Number(self.GetUrlParamValue('idplanta'));
    };

    self.ShowLoader = function () {
        $("#loader").removeClass("fadeOut");
    };

    self.HideLoader = function () {
        $("#loader").addClass("fadeOut");
    };

    self.UnselectAll = function (viewer) {
        viewer.scene.setObjectsVisible(viewer.scene.visibleObjectIds, false);
    };

    self.SelectFirstPlantaAsDefault = function (model, viewer) {
        $("#treeViewer ul > li > input").each(function (index, element) {
            if (index == 0) {
                $(element).click();

                if (model) {
                    viewer.cameraFlight.flyTo({
                        duration: 1.0,
                        aabb: model.aabb
                    });
                }
            } else {
                var newElmnt = $(element).parent().find("a.minus")[0];
                if (newElmnt) newElmnt.click();
            }
        });
    };

    self.ForceDefaultReorder = function () {
        $('[data-toggle="treeview"]')[0].click();
        $('[data-toggle="treeview"]')[2].click();
    };

    self.SetObjectSelectedInTreeView = function (model, viewer) {

        self.UnselectAll(self.CUSTOM_VIEWER);

        self.SelectFirstPlantaAsDefault(model, viewer);

        self.ForceDefaultReorder();

    };

    self.GetObjectIdWithoutDash = function (objectId) {
        if (objectId.includes('-')) {
            const parts = objectId.split('-');
            return parts[0];
        } else if (objectId.includes('.')) {
            const parts = objectId.split('.');
            return parts[0];
        }
        else {
            return objectId;
        }
    };

    self.GetNotFoundPropertyHtml = function () {
        return `
                           <div class="notFoundDiv">
                                <img src="../assets/img/not-found-property-background.png">
                                <h4>Nenhuma propriedade aqui!</h4>
                                <p>
                                    Selecione um elemento no modelo 3D para exibir todas as propriedades dele
                                </p>
                            </div>
                        `;
    };

    self.GetDetailHeaderHtml = function () {
        return `
                            <div class="propertySectionHeader">
                                <div id="fecharPropertySectionHeader">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99972 8.94283L11.2996 12.2427L12.2424 11.2999L8.94253 8.00003L12.2424 4.70019L11.2996 3.75739L7.99972 7.05722L4.69989 3.75739L3.75708 4.70019L7.05691 8.00003L3.75708 11.2999L4.69989 12.2427L7.99972 8.94283Z" fill="#6F6F6F"></path>
                                    </svg>
                                </div>
                                <div class="titlePropertySectionHeader">
                                    <span>
                                        Propriedades do elemento
                                    </span>
                                </div>
                            </div>
                        `;
    };

    self.GetDetailsHeader = function (addPropertySection) {
        if (addPropertySection) {
            var html = `<div id="propertySection">`;
            html += self.GetDetailHeaderHtml();
            html += `</div>`;
            return html;
        } else {
            return self.GetDetailHeaderHtml();
        }
    };

    self.RenderDetails = function (objectId) {

        if (!objectId) {
            var notFoundHtml = self.GetNotFoundPropertyHtml();
            $('#detailsViewer').html(notFoundHtml);
            return;
        }

        objectId = self.GetObjectIdWithoutDash(objectId);
        let viewer = self.CUSTOM_VIEWER;


        const metaObject = viewer.metaScene.metaObjects[objectId];
        const rootElement = document.createElement('div');
        rootElement.id = "propertySection";

        const ulElement = document.createElement('ul');
        ulElement.classList.add('divide-y', 'divide-zinc-400', 'divide-dashed', 'divide-y-reverse');

        const liTypeElement = document.createElement('li');
        const liIdElement = document.createElement('li');
        const liNameElement = document.createElement('li');

        liTypeElement.classList.add('py-1');
        liTypeElement.innerHTML = `
                                <div class="flex items-center">
                                    <div class="w-1/2">
                                        <h5 class="mb-0 mx-3 text-zinc-950 font-semibold">Tipo</h5>
                                    </div>
                                    <div class="w-1/2">
                                        <h5 class="mb-0 mx-3 text-zinc-950 font-bold">${metaObject.type}</h5>
                                    </div>
                                </div>
                            `;

        liIdElement.classList.add('py-1');
        liIdElement.innerHTML = `
                                <div class="flex items-center">
                                    <div class="w-1/2">
                                        <h5 class="mb-0 mx-3 text-zinc-950 font-semibold">ID</h5>
                                    </div>
                                    <div class="w-1/2">
                                        <h5 class="mb-0 mx-3 text-zinc-950 font-bold">${metaObject.id}</h5>
                                    </div>
                                </div>
                            `;

        liNameElement.classList.add('py-1');
        liNameElement.innerHTML = `
                                <div class="flex items-center">
                                    <div class="w-1/2">
                                        <h5 class="mb-0 mx-3 text-zinc-950 font-semibold">Nome</h5>
                                    </div>
                                    <div class="w-1/2">
                                        <h5 class="mb-0 mx-3 text-zinc-950 font-bold">${self.DecodeIfcName(metaObject.name)}</h5>
                                    </div>
                                </div>
                            `;

        ulElement.appendChild(self.CreateHandle('Elemento'));
        ulElement.appendChild(self.CreateHeader());
        ulElement.appendChild(liTypeElement);
        ulElement.appendChild(liIdElement);
        ulElement.appendChild(liNameElement);

        rootElement.appendChild(ulElement);

        Object.values(metaObject.propertySets).forEach(set => {
            const ul = document.createElement('ul');
            ul.classList.add('divide-y', 'divide-zinc-400', 'divide-dashed', 'divide-y-reverse');

            ul.appendChild(self.CreateHandle(set.name));
            ul.appendChild(self.CreateHeader());

            Object.values(set.properties).forEach(property => {

                const propertyName = self.DecodeIfcName(property.name);
                let unity = self.GetUnidadeDeMedida(propertyName);

                let propertyValue = typeof property.value === 'string' ? self.DecodeIfcName(property.value) : !Number.isNaN(Number(property.value)) && unity !== '' ? Number(property.value).toLocaleString('pt-BR', {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 0
                }) : property.value;

                if (propertyValue === 'F') {
                    propertyValue = 'Não';
                }

                if (propertyValue === 'T') {
                    propertyValue = 'Sim';
                }

                const li = document.createElement('li');
                li.classList.add('py-1');
                li.innerHTML = `
                                        <div class="flex items-center">
                                            <div class="w-1/2">
                                                <h5 class="mb-0 mx-3 text-zinc-950 font-semibold">${propertyName}</h5>
                                            </div>
                                            <div class="w-1/2">
                                                <h5 class="mb-0 mx-3 text-zinc-950 font-bold">${propertyValue} ${unity}</h5>
                                            </div>
                                        </div>
                                    `;
                ul.appendChild(li);
            });

            rootElement.appendChild(ul);
        });

        document.querySelector('#detailsViewer').innerHTML = '';
        document.querySelector('#detailsViewer').appendChild(rootElement);

        // Adicionar o header novo
        var headerHtml = self.GetDetailsHeader(false);
        $("#propertySection").prepend(headerHtml);

        self.EnableEventsForDetails();
    };

    self.EnableEventsForDetails = function () {
        $("#fecharPropertySectionHeader").off("click");


        $("#fecharPropertySectionHeader").on("click", function () {
            var element = document.querySelector('#details_button');

            document.querySelector('#detailsViewer').classList.add('hidden');
            if (element.classList.contains('active')) {
                element.classList.remove('active');
                var svgElement = $(element).find('svg').find('path')
                $(svgElement).attr("fill", "#161616");
            }
        });
    };

    self.CreateHandle = function (name) {
        const li = document.createElement('li');

        li.classList.add('bg-zinc-950', 'py-2', 'handle-li', 'active', 'cursor-pointer', 'px-3', 'relative');
        li.innerHTML = `
                                <div class="flex items-center" style="pointer-events: none;">
                                    <div class="w-full">
                                        <h4 class="mb-0 text-cc-black font-black">${self.DecodeIfcName(name)}</h4>
                                    </div>
                                </div>
                            `;

        return li;
    };

    self.CreateHeader = function (name) {
        const li = document.createElement('li');
        if (name) {
            li.classList.add('bg-zinc-950', 'py-2', 'handle-li', 'active', 'cursor-pointer', 'px-3', 'relative');
            li.innerHTML = `
                                <div class="flex items-center" style="pointer-events: none;">
                                    <div class="w-full">
                                        <h4 class="mb-0 text-cc-black font-black">${self.DecodeIfcName(name)}</h4>
                                    </div>
                                </div>
                            `;
        }

        return li;
    };

    self.DecodeIfcName = function (name) {

        try {
            name = name?.replace(/\\/g, "")
            name = name?.replace(/\'/g, "")
            name = name?.replace(/\"/g, "")

            let decoded = name?.replace(/X2([0-9A-F]{4,16})X0/g, function (match, group1) {
                let codes = [];
                for (let i = 0; i < group1.length; i += 4) {
                    let code = parseInt(group1.substr(i, 4), 16).toString(16).padStart(4, '0');
                    codes.push(code);
                }
                return String.fromCharCode.apply(null, codes.map(c => parseInt(c, 16)));
            })

            return decoded
        } catch (error) {
            return name
        }
    };

    self.ShowSuccessAlert = function (msg = "Operação realizada com sucesso") {
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: msg,
            showConfirmButton: true,
            allowOutsideClick: true,
            allowEscapeKey: true,
        })
    }

    self.ShowErrorAlert = function (msg) {
        Swal.fire({
            icon: 'error',
            title: 'Atenção',
            text: msg,
            showConfirmButton: true,
            allowOutsideClick: true,
            allowEscapeKey: true,
        })
    }

    self.ShowWarningAlert = function (msg) {
        Swal.fire({
            icon: 'warning',
            title: '',
            text: msg,
            showConfirmButton: true,
            allowOutsideClick: true,
            allowEscapeKey: true
        })
    }

    self.ShowErrorAlertWithoutButtons = function (msg) {
        Swal.fire({
            icon: 'error',
            title: 'Atenção',
            text: msg,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            footer: 'Sentimos muito pelo ocorrido, por gentileza, tente recarregar a página novamente em alguns minutos. Se o problema persistir, entre em contato com o administrador do sistema.'
        })
    }

    self.HandleError = function (result) {
        if (result !== undefined)
            self.ShowErrorAlertWithoutButtons(result.Message);
    };

    self.EnableEscKey = function () {
        try {
            navigator.keyboard.unlock(['Escape']);
        } catch {

        }
    };

    self.DisableEscKey = function () {
        try {
            navigator.keyboard.lock(['Escape']);
        } catch {

        }
    };

    self.EnterFullScreen = function () {
        self._isInfullScreen = true;

        if (document.documentElement.requestFullScreen) {
            document.documentElement.requestFullScreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullScreen) {
            document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }

        const toggleButton = document.querySelector('#fullscreen_button');
        toggleButton.classList.add('active');
        toggleButton.innerHTML = '<i class="mdi mdi-fullscreen-exit"></i>';

        self.ShowLogo();
        self.DisableEscKey();

    };

    self.ExitFullScreen = function () {
        self._isInfullScreen = false;

        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }

        const toggleButton = document.querySelector('#fullscreen_button');
        toggleButton.classList.remove('active');
        toggleButton.innerHTML = '<i class="mdi mdi-fullscreen"></i>';

        self.HideLogo();
        self.EnableEscKey();
    };

    self.ToggleFullScreen = function () {
        let enterFullScreenMode = !self._isInfullScreen && (document.fullScreenElement && document.fullScreenElement !== null) ||
            (!document.mozFullScreen && !document.webkitIsFullScreen);

        if (enterFullScreenMode) self.EnterFullScreen();
        else self.ExitFullScreen();
    }

    // --------------------------------
    //  Filter modal methods
    // --------------------------------

    self.GetFilterByColumnsModalHeaderHtml = function () {
        var cookieVal = self.CookieUtil.Get('DefaultOption');
        var alreadyChecked = (cookieVal) ? "checked" : "";

        var html = `
                            <div id="meuModal" class="modal modal-filtros-por-coluna">
                                <div class="modal-conteudo">
                                    <div class="modal-header">
                                        <div class="row">
                                           <div class="col-sm-12" style="margin-bottom: 16px; border-bottom: 1px solid #F3F3F3; padding-bottom: 16px;">
                                                <span class="text">Montar filtro de propriedades</span>
                                                <span class="fecharModalFiltros">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99972 8.94283L11.2996 12.2427L12.2424 11.2999L8.94253 8.00003L12.2424 4.70019L11.2996 3.75739L7.99972 7.05722L4.69989 3.75739L3.75708 4.70019L7.05691 8.00003L3.75708 11.2999L4.69989 12.2427L7.99972 8.94283Z" fill="#6F6F6F"></path>
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="row" style="margin-top: 16px;">
                                            <div class="col-sm-8">
                                                <div class="form-group position-relative">
                                                    <label for="selectConfiguracoesFiltrosSalvos" class="select-label">Modelos</label>
                                                    ${_modalFiltrosHtml}
                                                </div>
                                            </div>
                                            <div class="col-sm-4">
                                                <div id="abrirModeloPadraoArea">
                                                    <span>
                                                        <input id="checkboxAbrirModeloPadrao" type="checkbox" class="cc-custom-checkbox disabled-input-checkbox" ${alreadyChecked}>
                                                    </span>
                                                    <span class="abrirModeloPadraoText disabled-text">
                                                        Abrir esse modelo por padrão
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="modal-body">
                                        <div class="row">
                                            <div class="col-sm-6">
                                                <span class="todasAsColunasText">
                                                    Todas as colunas
                                                </span>
                                                <div class="row" style="margin-top: 16px">
                                                    <div class="col-sm-12">
                                                        <div class="search-container">
                                                            <i class="fas fa-search search-icon"></i>
                                                            <input type="text" id="searchInput" class="search-input" placeholder="Pesquisar" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="row">
                                                    <div class="col-sm-12">
                                                        <div id="todasAscolunasArea">

                        `;

        return html;
    };

    self.GetSalvarModeloIconSVG = function () {
        return `
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M8.75 9.91667C8.75 10.561 9.27233 11.0833 9.91667 11.0833C10.561 11.0833 11.0833 10.561 11.0833 9.91667C11.0833 9.27233 10.561 8.75 9.91667 8.75C9.27233 8.75 8.75 9.27233 8.75 9.91667ZM7.58333 9.91667C7.58333 8.628 8.628 7.58333 9.91667 7.58333C11.2053 7.58333 12.25 8.628 12.25 9.91667C12.25 11.2053 11.2053 12.25 9.91667 12.25C8.628 12.25 7.58333 11.2053 7.58333 9.91667ZM7.58333 4.08333C7.58333 2.79467 8.628 1.75 9.91667 1.75C11.2053 1.75 12.25 2.79467 12.25 4.08333C12.25 5.372 11.2053 6.41667 9.91667 6.41667C8.628 6.41667 7.58333 5.372 7.58333 4.08333ZM4.08333 7.58333C2.79467 7.58333 1.75 8.628 1.75 9.91667C1.75 11.2053 2.79467 12.25 4.08333 12.25C5.372 12.25 6.41667 11.2053 6.41667 9.91667C6.41667 8.628 5.372 7.58333 4.08333 7.58333ZM8.75 4.08333C8.75 4.72767 9.27233 5.25 9.91667 5.25C10.561 5.25 11.0833 4.72767 11.0833 4.08333C11.0833 3.439 10.561 2.91667 9.91667 2.91667C9.27233 2.91667 8.75 3.439 8.75 4.08333ZM2.91667 9.91667C2.91667 10.561 3.439 11.0833 4.08333 11.0833C4.72767 11.0833 5.25 10.561 5.25 9.91667C5.25 9.27233 4.72767 8.75 4.08333 8.75C3.439 8.75 2.91667 9.27233 2.91667 9.91667ZM2.91667 4.08333C2.91667 4.72767 3.439 5.25 4.08333 5.25C4.72767 5.25 5.25 4.72767 5.25 4.08333C5.25 3.439 4.72767 2.91667 4.08333 2.91667C3.439 2.91667 2.91667 3.439 2.91667 4.08333ZM4.08333 1.75C2.79467 1.75 1.75 2.79467 1.75 4.08333C1.75 5.372 2.79467 6.41667 4.08333 6.41667C5.372 6.41667 6.41667 5.372 6.41667 4.08333C6.41667 2.79467 5.372 1.75 4.08333 1.75Z"
                                    fill="#161616" />
                            </svg>
                        `;
    };

    self.GetImportarIconSvg = function () {
        return `
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M7.58329 5.49162V12.25H6.41663V5.49162L4.49577 7.41248L3.67081 6.58752L6.75834 3.5H2.33329V2.33333H11.6666V3.5H7.24158L10.3291 6.58752L9.50415 7.41248L7.58329 5.49162Z"
                                    fill="#353535" />
                            </svg>
                        `;
    };

    self.GetExportarIconSvg = function () {
        return `
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M6.41671 8.50838V1.75H7.58337V8.50838L9.50423 6.58752L10.3292 7.41248L7.24166 10.5H11.6667V11.6667H2.33337V10.5H6.75842L3.67089 7.41248L4.49585 6.58752L6.41671 8.50838Z"
                                    fill="#353535" />
                            </svg>
                        `;
    };

    self.GetFilterByColumnsModalFooterHtml = function () {
        var salvarConfiguracoesHtml = self.IdUsuario != -1 ? `<span class="salvarConfiguracaoFiltroBtn" style="" onclick="return _mainModel.OpenSalvarConfiguracaoFiltrosModal()">${self.GetSalvarModeloIconSVG()} Salvar modelo</span>` : "";

        var html = `
                                                        </div>
                                                     </div>
                                                </div>
                                            </div>
                                            <div class="col-sm-6">
                                                <span class="todasAsColunasText">
                                                    Colunas visíveis
                                                </span>
                                                <div class="row" style="margin-top: 16px">
                                                    <div class="col-sm-12">
                                                        <div>
                                                            <div class="row" style="width: 100%;">
                                                                <div class="col-sm-5">
                                                                    ${salvarConfiguracoesHtml}
                                                                </div>
                                                                <div class="col-sm-7">
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="row" style="margin-top: 12px; margin-bottom: 12px;">
                                                    <div class="col-sm-12">
                                                        <div class="flex-row">
                                                            <span>Agrupar por:</span>
                                                            <span class="groupByTooltip" data-bs-placement="top" data-bs-toggle="tooltip" title="A coluna adicionada nesta seção terá a função de agrupar todas as outras">${self.GetExclamationIcon()}</span>
                                                            <div id="groupByArea" class="tick-border-area groupByArea"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style="margin-bottom: 12px;">Solte aqui os objetos para montar as colunas:</span>
                                                <div id="colunasVisiveisArea">
                                                    <div class="tickedBox"></div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                    <div class="modal-footer">
                                        <div id="importarExportarModalColumnsArea">
                                            <span id="importarCfgButton"> ${self.GetImportarIconSvg()} Importar</span> <span id="exportarCfgButton">${self.GetExportarIconSvg()} Exportar</span>
                                        </div>
                                        <div>
                                            <button id="cancelarModalFiltros">Cancelar</button>
                                            <button id="salvar" class="btn-salvar-configuracoes active text-sm">Montar filtro</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
        return html;
    };

    self.GetFederarArquivosModalHeaderHtml = function (allFiles) {
        var html = `
                            <div id="meuModal" class="modal-federar-arquivos modal">
                                <div class="modal-conteudo modal-conteudo-federar-arquivos">
                                    <div class="modal-header">
                                        <div class="row">
                                            <div class="col-sm-12" style="border-bottom: 1px solid #dee2e6; padding-bottom: 16px; margin-bottom: 16px;padding-left: 0px; padding-right: 0px">
                                                <span class="text">Federar documentos</span>
                                                <span class="fecharModalFederarArquivos">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99972 8.94283L11.2996 12.2427L12.2424 11.2999L8.94253 8.00003L12.2424 4.70019L11.2996 3.75739L7.99972 7.05722L4.69989 3.75739L3.75708 4.70019L7.05691 8.00003L3.75708 11.2999L4.69989 12.2427L7.99972 8.94283Z" fill="#6F6F6F"/>
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>

                                        <div class="row" style="margin-top: 16px;">
                                            <div class="col-sm-12" style="padding-left: 0px;">
                                                <span>Escolha entre os ${_totalDocs} documentos disponíveis aqueles que deseja federar: </span>
                                            </div>
                                        </div>

                                        <div class="row" style="margin-top: 16px">
                                            <div class="col-sm-6" style="padding-left: 0px;">
                                               <div class="search-container">
                                                    <i class="fas fa-search search-icon"></i>
                                                    <input type="text" class="search-input" placeholder="Pesquisar">
                                                </div>
                                            </div>

                                            <div class="col-sm-6" style="padding-right: 0px;">
                                               <div class="form-group position-relative">
                                                    <label for="disciplineSelect" class="select-label">Disciplina</label>
                                                    ##DISCIPLINAS_COMBOBOX##
                                                </div>
                                            </div>
                                        <div>
                                    </div>
                                    <div class="modal-body">
                                        <div class="row">
                                            <div class="col-sm-12">
                                                <div id="PlantasParaSeremFederadasSection">
                                                    ${self.GetFederarArquivosModalBodyHtml(allFiles)}
                                                </div>
                                            <div>
                                        </div>


                        `;
        return html;
    };

    self.GetFederarArquivosModalFooterHtml = function () {
        var html = `
                                    </div>

                                </div>

                            </div>

                            <div class="modal-footer">
                                        <button id="cancelarModalFederarArquivosBtn">Cancelar</button>
                                        <button id="federarArquivosBtn" class="btn-salvar-configuracoes active text-sm">Federar arquivos</button>
                                    </div>
                        `;
        return html;
    };

    self.GenerateCustomId = function (optionName, optionCategory) {
        var hash = CryptoJS.MD5(optionName + optionCategory).toString();
        return hash;
    };

    self.GenerateUniqueDatatableId = function () {
        var currentDate = new Date();
        var uniqueString = currentDate.toJSON() + currentDate.getMilliseconds();
        return 'datatable-' + CryptoJS.MD5(uniqueString).toString();
    };

    self.GetUrlToken = function () {
        var urlParams = new URLSearchParams(window.location.search);
        var token = urlParams.get('token');
        return encodeURIComponent(token);
    };

    self.GetAllArquivosFederados = async function () {
        var _response = null;
        $.ajax({
            url: '/BIM/GetModels',
            type: 'POST',
            data: {
                idObra: self.IdObra,
                idPlanta: null,
                token: self.GetUrlToken(),
                isMobile: false
            },
            async: false,
            success: function (response) {
                if (response.success == false) {
                    self.ShowErrorAlert('Ocorreu um erro ao recuperar os modelos. Tente novamente e se o erro continuar, por favor, reporte um issue');
                }

                _response = response;
            },
            error: function (xhr, status, error) {
                self.ShowErrorAlert('Ocorreu um erro ao recuperar os modelos. Tente novamente e se o erro continuar, por favor, reporte um issue');
            }
        });
        return _response;
    };

    self.GetDisciplinasByObraHtmlAsync = async function (allFiles) {
        var _response = null;
        var idsDisciplinas = allFiles.map(function (item) {
            return item.IdDisciplina;
        });
        $.ajax({
            url: '/BIM/GetDisciplinasByObraHtmlAsync',
            type: 'POST',
            data: {
                idObra: self.IdObra,
                token: self.GetUrlToken(),
                idsDisciplinas: JSON.stringify(idsDisciplinas)
            },
            async: false,
            success: function (response) {
                if (response.success == false) {
                    self.ShowErrorAlert('Erro ao buscar disciplinas. Tente novamente e se o erro continuar, por favor, reporte um issue');
                }

                _response = response;
            },
            error: function (xhr, status, error) {
                self.ShowErrorAlert('Erro ao buscar disciplinas. Tente novamente e se o erro continuar, por favor, reporte um issue');
            }
        });
        return _response;
    };

    self.RealizaChamadaParaAtivarCacheDisciplinas = async function () {
        // var _response = null;
        // $.ajax({
        //     url: '/BIM/RealizaChamadaParaAtivarCacheDisciplinas',
        //     type: 'POST',
        //     data: {
        //         idObra: self.IdObra,
        //         token: self.GetUrlToken()
        //     },
        //     async: false,
        //     success: function (response) {
        //         if (response.success == false) {
        //             self.ShowErrorAlert(response.msg);
        //         }

        //         _response = response;
        //     },
        //     error: function (xhr, status, error) {
        //         self.ShowErrorAlert("Erro ao consultar. Tente novamente. Mais informações no console do navegador.")
        //         console.log("Erro na chamada AJAX:", error);
        //     }
        // });
        // return _response;
    };

    self.GetFederarArquivosModalHtml = async function () {
        var html = "";
        var allFiles = await self.GetAllArquivosFederados();
        var header = self.GetFederarArquivosModalHeaderHtml(allFiles);
        var comboboxHtml = await self.GetDisciplinasByObraHtmlAsync(allFiles);
        header = header.replace("##DISCIPLINAS_COMBOBOX##", comboboxHtml);
        var footer = self.GetFederarArquivosModalFooterHtml();
        html = header + footer;
        return html;
    };

    self.GetExclamationIcon = function () {
        return `
                            <div class="exclamation-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <g clip-path="url(#clip0_1490_7746)">
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M8.00008 14.0001C11.3138 14.0001 14.0001 11.3138 14.0001 8.00008C14.0001 4.68637 11.3138 2.00008 8.00008 2.00008C4.68637 2.00008 2.00008 4.68637 2.00008 8.00008C2.00008 11.3138 4.68637 14.0001 8.00008 14.0001ZM8.00008 15.3334C12.0502 15.3334 15.3334 12.0502 15.3334 8.00008C15.3334 3.94999 12.0502 0.666748 8.00008 0.666748C3.94999 0.666748 0.666748 3.94999 0.666748 8.00008C0.666748 12.0502 3.94999 15.3334 8.00008 15.3334Z"
                                            fill="#353535" />
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M7.33341 9.33341V4.00008H8.66675V9.33341H7.33341ZM7.33341 12.0001L7.33341 10.6667H8.66675L8.66675 12.0001H7.33341Z"
                                            fill="#353535" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_1490_7746">
                                            <rect width="16" height="16" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                        `;
    };

    self.GetFederarArquivosModalBodyHtml = function (allFiles) {
        if (!allFiles) return "<strong>Não foram encontrados arquivos elegíveis para federação.</strong>";
        var html = "";
        var arrayLength = allFiles.length;
        for (var i = 0; i < arrayLength; i++) {
            var file = allFiles[i];
            html += `
                                <div id="${file.planta_id}" class="cardSection">
                                    <span class="icon"><input type="checkbox"  class="cc-custom-checkbox" /></span>
                                    <div class="modal-title-area">
                                        <span class="propertyCategory">Disciplina: <strong>${file.DisciplinaNomeWithSigla}</strong></span>
                                        <span class="propertyName">${file.type}</span>
                                    </div>
                                </div>
                            `;
        }

        html += `
                            <div id="NenhumRegistroEncontrado" style="display: none;">
                                ${self.GetExclamationIcon()} <span>Nenhum registro encontrado</span>
                            </div>
                        `;

        html += `
                             <hr id="selectedItemsSeparator">
                        `;

        return html;
    };

    self.GetMenuHamburguerOptionsHtml = function () {
        return `
                            <div class="iconMenuWithOptions">
                                <ul>
                                    <li onclick="return _mainModel.AddGroupByOption(this)">Agrupar por essa coluna</li>
                                </ul>
                            </div>
                        `;
    };

    self.GetMenuHamburguerArea = function () {
        return `
            <span class="icon" onclick="return _mainModel.HandleMenuHamburguerClick(this)" style="width: 20px; height: 20px; background: transparent;">${self.GetMenuHamburguerSVG()}</span>
                            ${self.GetMenuHamburguerOptionsHtml()}
                        `;
    };

    self.HandleMenuHamburguerClick = function (elment) {
        $(elment).parent().find('.iconMenuWithOptions').show();

    };

    self.GetFilterByColumnsModalHtml = function () {
        var allOptions = self.GetAllFilterOptions();
        var html = self.GetFilterByColumnsModalHeaderHtml();

        // body
        if (allOptions && allOptions.length > 0) {
            allOptions.forEach(function (option) {
                var customId = self.GenerateCustomId(option.Name, option.Category);
                html += `<div id="${customId}" class="cardSection">
                                            <span class="icon" >${self.GetMenuHamburguerSVG()}</span>
                                            <div class="modal-title-area">
                                                <span class="propertyCategory">${option.Category}</span>
                                                <span class="propertyName">${option.Name}</span>
                                            </div>
                                        </div>`;
            });
        }
        html += `
                            <div id="nenhumRegistroEncontradoFiltroPropriedades" style="display: none;">
                                ${self.GetExclamationIcon()} <span>Nenhum registro encontrado</span>
                            </div>
                        `;

        html += self.GetFilterByColumnsModalFooterHtml();

        return html;

    };

    self.GetSalvarConfiguracaoFiltrosModalHtml = function () {
        var html = `
                            <div id="meuModal" class="modal-salvar-configuracao-filtro modal">
                                <div class="modal-conteudo modal-conteudo-salvar-configuracao-filtro">
                                    <div class="modal-header no-padding" style="padding-bottom: 16px !important;">
                                        <span class="text">Salvar modelo</span>
                                        <span class="fecharModalSalvarConfiguracaoFiltros">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99972 8.94283L11.2996 12.2427L12.2424 11.2999L8.94253 8.00003L12.2424 4.70019L11.2996 3.75739L7.99972 7.05722L4.69989 3.75739L3.75708 4.70019L7.05691 8.00003L3.75708 11.2999L4.69989 12.2427L7.99972 8.94283Z" fill="#6F6F6F"/>
                                            </svg>
                                        </span>
                                    </div>
                                    <div class="modal-body">
                                        <div class="row">
                                            <div class="col-sm-12 no-padding">
                                                <span>
                                                    O modelo facilita o acesso às propriedades, podendo ser selecionado por padrão para maior praticidade.
                                                </span>
                                            </div>
                                        </div>
                                        <div class="row" style="margin-top: 16px;">
                                            <div class="col-sm-12 no-padding">
                                                <div class="form-group position-relative">
                                                    <label for="nomeConfiguracaoFiltro" class="select-label">Nome</label>
                                                    <input id="nomeConfiguracaoFiltro" type="text" class="form-control" autocomplete="off">
                                                </div>
                                            </div>
                                        </div>

                                        <div class="row" style="margin-top: 16px; margin-bottom: 16px;">
                                                <div class="col-sm-12 no-padding">
                                                    <div class="visibilidadeArea">
                                                        <div class="optionArea optionSelectedActive">
                                                            <label class="btn" for="apenasParaMim" data-bs-placement="top" data-bs-toggle="tooltip" title="O modelo será visível apenas para você">Apenas para mim</label>
                                                            <input id="apenasParaMim" class="btn-check" type="radio" name="visibilidade" autocomplete="off" checked>
                                                        </div>
                                                        <div class="optionArea" >
                                                            <label class="btn" for="publico" data-bs-placement="top" data-bs-toggle="tooltip" title="O modelo será visível para todos que podem acessar o documento">Público</label>
                                                            <input id="publico" class="btn-check" type="radio" name="visibilidade" autocomplete="off">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>


                                </div>
                                <div class="modal-footer">
                                    <button id="cancelarModalSalvarConfiguracaoFiltrosBtn">Cancelar</button>
                                    <button id="salvarModeloFiltroBtn" class="btn-salvar-configuracoes active text-sm">Salvar</button>
                                </div>
                                </div>
                            </div>

                        `;
        return html;
    };

    self.EnableSetVisibilidadeModalEvent = function () {

        $('.optionArea').on("click", function () {
            var $this = $(this);
            var condition = $this.hasClass('optionSelectedActive');
            if (!condition) {
                $('.optionSelectedActive').removeClass('optionSelectedActive');
                $this.addClass('optionSelectedActive')
            }

            var option = $this.find('label').text();
            if (option === "Apenas para mim") {
                $("#apenasParaMim").prop("checked", true);
                $("#publico").prop("checked", false);
            } else {
                $("#publico").prop("checked", true);
                $("#apenasParaMim").prop("checked", false);
            }
        });

    };

    self.GetVisibilidadeSelecionada = function () {
        if ($("#apenasParaMim").prop("checked"))
            return self.VisibilidadeEnum.ApenasParaMim;

        if ($("#publico").prop("checked"))
            return self.VisibilidadeEnum.Compartilhado;

        return -1;
    };

    self.CloseFilterByColumnsModal = function () {
        $(".modal.modal-filtros-por-coluna").hide();
        $("#filter_button").removeClass('active');
        var svgElement = $("#filter_button").find('svg').find('path')
        $(svgElement).attr("fill", "#161616");
    };

    self.CloseFederarArquivosModal = function () {
        $(".modal.modal-federar-arquivos").hide();
        $("#federar_button").removeClass('active');
    };

    self.CloseSalvarConfiguracaoFiltroModal = function () {
        $(".modal.modal-salvar-configuracao-filtro").hide();

    };

    self.CloseSalvarVisaoCompartilhadaModal = function () {
        $(".modal.modal-salvar-visao-compartilhada").hide();
    };

    self.CloseLinkVisaoCompartilhadaModal = function () {
        $(".modal.modal-link-visao-compartilhada").hide();
    };

    self.Search = function () {
        var filter = $("#searchInput").val().toLowerCase().trim();
        var hasVisibleElements = false;

        $("#todasAscolunasArea .modal-title-area").each(function () {
            var element = $(this);
            var parentElement = $(element).parent();
            var proprietyName = $(element).find('.propertyName').html().toLowerCase().trim();
            var proprietyCategory = $(element).find('.propertyCategory').html().toLowerCase().trim();

            if (!filter) {
                $(parentElement).show();
                return;
            }

            if (proprietyName.includes(filter) || proprietyCategory.includes(filter)) {
                $(parentElement).show();
                hasVisibleElements = true;
            }
            else
                $(parentElement).hide();
        });

        if (hasVisibleElements) {
            $("#nenhumRegistroEncontradoFiltroPropriedades").hide();
        } else {

            $("#nenhumRegistroEncontradoFiltroPropriedades").show();
        }
    };

    self.EnableModalSearchEvent = function () {
        $("#searchInput").on("keyup", function () {
            self.Search();
        });
    };

    self.GetAllVisibleColumns = function (useToRenderDatatable) {
        var datatableCustomColumns = [];

        if (useToRenderDatatable == undefined) {
            useToRenderDatatable = true
        }

        $("#colunasVisiveisArea .cardSection").each(function (id, elmnt) {
            var element = $(elmnt);
            var propertyCategory = $(element).find('.propertyCategory').html().trim();
            var propertyName = $(element).find('.propertyName').html().trim();
            if (propertyCategory && propertyName) {

                if (useToRenderDatatable) {
                    datatableCustomColumns.push({
                        Name: propertyName,
                        Category: propertyCategory
                    });
                } else {
                    datatableCustomColumns.push({
                        name: propertyName,
                        category: propertyCategory
                    });
                }
            }
        });

        return datatableCustomColumns;
    };

    self.GetAllMetaObjectsFromViewer = function () {
        if (!self._AllObjectMetaDataCache) {
            var viewer = self.CUSTOM_VIEWER;
            var objects = viewer.scene.objects;
            var response = [];

            for (var objectId in objects) {
                var objectMetaData = self.GetMetaDataFromObject(objectId);
                response.push(objectMetaData);
            }

            self._AllObjectMetaDataCache = response;
            return response;
        }

        return self._AllObjectMetaDataCache;
    };

    self.AddDefaultColumns = function (columns) {

        const defaultColumn0 = { Name: "CheckBox", Category: "System Default" };
        const defaultColumn2 = { Name: "Element Name", Category: "System Default" };
        columns.unshift(defaultColumn2);
        columns.unshift(defaultColumn0);

        return columns;
    };

    self.ReorderColumnsByGroupBy = function (columns, groupName) {
        const index = columns.findIndex(column => column.Name === groupName);
        const indexGroupByColumn = 4;
        const itemFindedAndIsNotInSecondPosition = index !== -1 && index !== indexGroupByColumn;

        if (itemFindedAndIsNotInSecondPosition) {
            // Remover o item do array e inserir o item na 4ª posição
            const [item] = columns.splice(index, 1);
            columns.splice(indexGroupByColumn, 0, item);
        }

        return columns;
    };

    self.GetMetaObjectPropertySetValue = function (metaObject, propertySetCategory, propertySetCategoryChild) {
        const propertySet = metaObject.propertySets.find(p => p.name === propertySetCategory);
        if (!propertySet) return null;

        const property = propertySet.properties.find(prop => prop.name === propertySetCategoryChild);
        if (!property) return null;

        return property.value;
    };

    self.GetGroupyByDatatableDataSet = function (metaObjects, datatableColumns, groupByName, groupByCategory) {
        var dataSet = [];
        var hasToAddColumnCommonType = self.ArrayContainsSpecificElement(datatableColumns, "System Default", "Common Type");
        var hastoAddColumnDocumentName = self.ArrayContainsSpecificElement(datatableColumns, "System Default", "Document Name");

        metaObjects.forEach(function (metaObject) {
            const rowData = {}
            rowData['id'] = metaObject.id;
            datatableColumns.forEach(function (column) {

                if (column.Category == "System Default") {

                    if (column.Name == "CheckBox") {
                        rowData[column.Name] = '<input type="checkbox" class="selectCheckBox cc-custom-checkbox" />';
                        return;
                    }

                    if (column.Name == "Element Name") {
                        rowData[column.Name] = metaObject.name;
                        return;
                    }

                    if (hastoAddColumnDocumentName) {
                        if (column.Name == "Document Name") {
                            rowData[column.Name] = metaObject.metaModel.customProperty.NomeDocumento;
                            return;
                        }
                    }

                    if (hasToAddColumnCommonType) {
                        if (column.Name == "Common Type") {
                            rowData[column.Name] = metaObject.type;
                            return;
                        }
                    }

                } else {
                    var propertyName = column.Name;
                    var unityType = self.GetUnidadeDeMedida(propertyName);
                    var rowDefaultValue = self.GetMetaObjectPropertySetValue(metaObject, column.Category, column.Name);
                    var rowValue = (unityType && rowDefaultValue) ? rowDefaultValue + ' ' + '<strong>' + unityType + '</strong>' : rowDefaultValue;
                    rowData[column.Name] = rowValue;
                }
            });

            dataSet.push(rowData);
        });

        return dataSet;
    };

    self.MergeObjects = function (object1, object2) {
        return Object.assign({}, object1, object2);
    }

    self.GetIndexColumnToGroupBy = function (api, groupByName) {
        var columnIndexes = api.settings()[0].aoColumns.map(function (col, index) {
            return col.data === groupByName ? index : -1;
        }).filter(index => index !== -1);
        return columnIndexes[0];
    };

    self.GetPlusCircleIconSvg = function () {
        return `
                            <svg class="datatablePlusIcon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <g clip-path="url(#clip0_1469_16558)">
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                        d="M6 10.4C8.43005 10.4 10.4 8.43005 10.4 6C10.4 3.56995 8.43005 1.6 6 1.6C3.56995 1.6 1.6 3.56995 1.6 6C1.6 8.43005 3.56995 10.4 6 10.4ZM6 11.5C9.03757 11.5 11.5 9.03757 11.5 6C11.5 2.96243 9.03757 0.5 6 0.5C2.96243 0.5 0.5 2.96243 0.5 6C0.5 9.03757 2.96243 11.5 6 11.5Z"
                                        fill="#6F6F6F" />
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                        d="M5.45 5.45V3.8H6.55V5.45H8.2V6.55H6.55V8.2H5.45V6.55H3.8V5.45H5.45Z" fill="#6F6F6F" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_1469_16558">
                                        <rect width="12" height="12" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                        `;
    };

    self.GetMinusCircleIconSvg = function () {
        return `
                            <svg class="datatableMinusIcon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <g clip-path="url(#clip0_1436_10289)">
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                        d="M6 10.4C8.43005 10.4 10.4 8.43005 10.4 6C10.4 3.56995 8.43005 1.6 6 1.6C3.56995 1.6 1.6 3.56995 1.6 6C1.6 8.43005 3.56995 10.4 6 10.4ZM8.75 6.55H3.25V5.45H8.75V6.55ZM6 11.5C9.03757 11.5 11.5 9.03757 11.5 6C11.5 2.96243 9.03757 0.5 6 0.5C2.96243 0.5 0.5 2.96243 0.5 6C0.5 9.03757 2.96243 11.5 6 11.5Z"
                                        fill="#6F6F6F" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_1436_10289">
                                        <rect width="12" height="12" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                        `;
    };

    self.GetGroupByDatatableInstance = function (groupByName, groupByCategory, defaultDatatableOptions, datatableColumns) {
        datatableColumns = self.AddDefaultColumns(datatableColumns);

        var metaObjects = self.GetAllMetaObjectsFromViewer();
        var dataSet = self.GetGroupyByDatatableDataSet(metaObjects, datatableColumns, groupByName, groupByCategory);
        var columns = Object.keys(dataSet[0]).map(function (key) {
            return { "data": key, "title": key };
        });
        columns.shift(); // remove a primeira coluna com o id que vai ser usado no "createdRow"
        var filteredDataSet = dataSet.filter(row => row[groupByName] != null);
        var customDatatableOptions = {
            data: filteredDataSet,
            columns: columns,
            "drawCallback": function (settings) {
                var api = this.api();
                var rows = api.rows({ page: 'all' }).nodes();
                var grouped = {};
                var totalColumns = api.columns().nodes().length
                var groupByIndex = self.GetIndexColumnToGroupBy(api, groupByName);

                // Realiza agrupamento baseado no filteredDataSet recebido e na coluna que foi informada para fazer o group by
                api.column(groupByIndex, { page: 'all' }).data().each(function (group, i) {
                    if (!group) group = 'Não Especificado';
                    if (!grouped[group]) {
                        grouped[group] = true;
                        var rowCount = api.rows().data().filter(row => (row[groupByName] || 'Não Especificado') === group).length;
                        $(rows).eq(i).before(
                            `<tr class="group">
                                                <td colspan="${totalColumns}">
                                                    <button class="toggle-group" data-group="${group}">${self.GetPlusCircleIconSvg()}</button> Agrupamento: <strong>${group}</strong> (${rowCount})
                                                </td>
                                            </tr>`
                        );
                    }
                    $(rows).eq(i).css('display', 'none'); // Esconde as linhas filhas por padrão
                });

                $('.toggle-group').off('click').on('click', function () {
                    var button = $(this)[0];
                    var contemClassePlus = $(button).find('svg').hasClass('datatablePlusIcon');
                    var svgContemClassePlus = $(self.GetPlusCircleIconSvg()).hasClass('datatablePlusIcon');
                    var haveToShowMinusBtn = contemClassePlus == svgContemClassePlus;
                    var visibility = haveToShowMinusBtn ? 'table-row' : 'none';

                    if (haveToShowMinusBtn) {
                        $(button).html(self.GetMinusCircleIconSvg());
                        $(button).parent().addClass('cc_custom_border-left-datatable');
                    } else {
                        $(button).html(self.GetPlusCircleIconSvg());
                        $(button).parent().removeClass('cc_custom_border-left-datatable');
                    }


                    // Navega até a linha de grupo e altera a visibilidade das linhas filhas
                    var startTr = $(this).closest('tr').next('tr');
                    while (startTr.length && !startTr.hasClass('group')) {
                        if (startTr.find('td').length > 0) {
                            startTr.css('display', visibility);
                        }
                        startTr = startTr.next('tr');
                    }
                });
            },
            "pageLength": -1,
            "lengthMenu": [[-1], ["Todos"]]

        };

        var datatableOptions = self.MergeObjects(customDatatableOptions, defaultDatatableOptions);
        var dtTableInstance = $('#tabela_filtros').DataTable(datatableOptions);
        return dtTableInstance;
    };

    self.ArrayContainsSpecificElement = function (array, category, name) {
        return array.some(function (element) {
            return element.Category === category && element.Name === name;
        });
    }

    self.GetDefaultDatatableInstance = function (defaultDatatableOptions, datatableColumns) {
        var hasToAddColumnCommonType = self.ArrayContainsSpecificElement(datatableColumns, "System Default", "Common Type");
        var hastoAddColumnDocumentName = self.ArrayContainsSpecificElement(datatableColumns, "System Default", "Document Name");
        var columns = datatableColumns.map(function (item) {
            return { title: item.Name };
        });

        // reordena
        columns.unshift({ title: "Nome elemento" });
        columns.unshift({ title: "Selecionar" });

        var metaObjects = self.GetAllMetaObjectsFromViewer();
        var dataset = metaObjects.map(function (metaObject) {
            var row = ['<input type="checkbox" class="selectCheckBox cc-custom-checkbox" />', metaObject.name];
            datatableColumns.forEach(function (column) {

                if (column.Category == "System Default") {
                    if (hastoAddColumnDocumentName) {
                        if (column.Name == "Document Name") {
                            row.push(metaObject.metaModel.customProperty.NomeDocumento);
                            return;
                        }
                    }

                    if (hasToAddColumnCommonType) {
                        if (column.Name == "Common Type") {
                            row.push(metaObject.type);
                            return;
                        }
                    }
                }

                try {
                    var propertySet = metaObject.propertySets.find(function (set) {
                        return set.name === column.Category;
                    });

                    if (!propertySet) {
                        row.push('N/A');
                    } else {
                        var property = propertySet.properties.find(function (prop) {
                            return prop.name === column.Name;
                        });

                        if (property && property.value) {

                            var unidadeMedida = self.GetUnidadeDeMedida(column.Name);
                            var rowValue = (unidadeMedida) ? property.value + ' ' + "<strong>" + unidadeMedida + "</strong>" : property.value;
                            row.push(rowValue)

                        } else {
                            row.push('N/A');
                        }
                    }
                } catch (err) {
                    console.log(err)
                }
            });

            row.id = metaObject.id;
            return row;
        });

        var customDatatableOptions = {
            "columns": columns,
            "data": dataset,
            "lengthMenu": [[10, 50, 100, 1000, -1], ["10 linhas", "50 linhas", "100 linhas", "1000 linhas", "Todos"]]
        };
        var datatableOptions = self.MergeObjects(customDatatableOptions, defaultDatatableOptions);
        var dtTableInstance = $('#tabela_filtros').DataTable(datatableOptions);

        return dtTableInstance;
    };

    self.RemoveFilters = function () {
        $('.dataTables_filter').remove();
    };

    self.CreateFiltersForDatatableColumns = function () {
        $("#tabela_filtros thead tr")
            .clone(true)
            .addClass('dataTables')
            .appendTo("#tabela_filtros tfoot:not(.totaisArea)");
    };

    self.DisableSearchEvents = function () {
        $('.enableSearch').each(function () {
            var element = this;
            $(element).unbind();
        });
    };

    self.EnableSearchEvents = function () {

        self.DisableSearchEvents();

        // Desabilita ordenação ao clicar no input
        $('#tabela_filtros thead input').on('click', function (e) {
            e.stopPropagation();
        });

        $('.enableSearch').on('keyup change', function (ev) {
            ev.stopPropagation();

            var colIndex = $(this).parent().index();
            var table = self._PropertiesFilterDatatable[0].instance;
            var valueToSearch = (this.value) ? this.value.trim() : this.value;
            table.column(colIndex).search(valueToSearch).draw();
        });
    };

    self.MudaPosicaoPaginacao = function () {
        var element = $('.dataTables_paginate.paging_simple_numbers')
        var elementHTML = $(element).html();
        var destinyElement = $("#tabela_filtros");

        $(element).remove()
        $(destinyElement).append(elementHTML)
    };

    self.RemoveAcents = function (text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    };

    self.TransformCreatedColumnsIntoInputs = function () {
        $("#tabela_filtros tfoot:not(.totaisArea) th").each(function (idx, elmt) {
            var hasClassNoFilter = $(this).hasClass('noFilter');
            var isFirstColumn = idx == 0;

            if (isFirstColumn) {
                var title = $(this).text();
                var titleId = "search_" + self.RemoveAcents(title).replaceAll(" ", "-").trim();
                $(this).html('<input id="' + titleId + '" class="selectAllCheckBox cc-custom-checkbox" type="checkbox" />');
                $(this).removeClass('sorting');
                $(this).removeClass('sorting_asc');
                $(this).removeAttr('aria-sort');
            } else {
                var title = $(this).text();
                var titleId = "search_" + self.RemoveAcents(title).replaceAll(" ", "-").trim();
                $(this).html('<input class="form-control form-control-sm enableSearch" id="' + titleId + '" type="text" placeholder="' + title + '" autocomplete="off" />');
            }
        });
    };

    self.AppendFooterFiltersIntoThead = function () {
        $("#tabela_filtros tfoot:not(.totaisArea) tr").appendTo("#tabela_filtros thead");
        $("#tabela_filtros thead > tr:first-child").remove();
    }

    self.FormatNumber = function (num) {
        if (num % 1 !== 0) {
            return num.toFixed(4);
        } else {
            return num;
        }
    };

    self.GetGroupByObject = function (useToRenderDatatable) {
        var response = null;
        var groupByName = $(".groupByArea > .groupByCard > .groupByName").text().trim();
        var groupByCategory = $(".groupByArea > .groupByCard > .groupByCategory").text().trim();

        if (useToRenderDatatable == undefined) {
            useToRenderDatatable = true
        }

        if (useToRenderDatatable) {
            if (groupByName) {
                response =
                {
                    "GroupByCategory": groupByCategory,
                    "GroupByName": groupByName
                };
            }
        } else {
            if (groupByName) {
                response =
                {
                    "category": groupByCategory,
                    "name": groupByName
                };
            }
        }

        return response;
    };

    self.GetAllColumnsToCalculateTotalIds = function (api) {
        var totalDeColunas = api.columns().nodes().length;
        var numericColumns = [];

        // ignora as duas primeiras (checkbox e nome elemento)
        for (let i = 2; i < totalDeColunas; i++) {
            var hasNumeric = false;

            api.column(i, { page: 'all' }).data().each(function (value) {
                if (!isNaN(parseFloat(value))) {
                    hasNumeric = true;
                    return false; // break loop if numeric value found
                }
            });

            if (hasNumeric) {
                numericColumns.push(i);
            }
        }

        return numericColumns;
    };


    self.GetDefaultDatatableOptions = function () {
        return {
            "language": self.GetDatatableLanguageOptions(),
            "info": true,
            "footerCallback": function (row, data, start, end, display) {
                try {
                    var api = this.api();
                    var totalDeColunas = api.columns().nodes().length;
                    $("table tfoot.totaisArea").html("")
                    $("table tfoot.totaisArea").append("<tr> </tr>");
                    var footerRow = $("table tfoot.totaisArea tr");
                    var needToCalcTotals = self.GetAllColumnsToCalculateTotalIds(api);

                    for (let i = 0; i < totalDeColunas; i++) {

                        if (!needToCalcTotals.includes(i)) {
                            footerRow.append('<th></th>');
                            continue;
                        }

                        if (api && api.column(i)) {
                            var total = api.column(i, { page: 'current' }).data()
                                .reduce(function (a, b) {
                                    var valA = isNaN(parseFloat(a)) ? 0 : parseFloat(a);
                                    var valB = isNaN(parseFloat(b)) ? 0 : parseFloat(b);
                                    return valA + valB;
                                },
                                    0);

                            if (!isNaN(total)) {
                                var columnName = $(api.column(i).header()).text();
                                var unidadeMedida = self.GetUnidadeDeMedida(columnName);

                                if (unidadeMedida) {
                                    footerRow.append(`<th>Total: <span>${self.FormatNumber(total)} <strong>${unidadeMedida}</strong></span></th>`);
                                } else {
                                    footerRow.append(`<th>Total: <span>${self.FormatNumber(total)}</span></th>`);
                                }

                            } else {
                                footerRow.append('<th></th>');
                            }
                        }
                    }

                } catch (err) {
                    console.log("erro em 'footerCallback'", err);
                }
            },
            "initComplete": function (settings, json) {
                self.CloseFilterByColumnsModal();
            },
            "createdRow": function (row, data, dataIndex) {
                $(row).attr('id', 'row-' + data.id);
            },
            dom: 'Blfrtip', // Adiciona os botões no elemento DOM da tabela, cada letra significa uma config
            buttons: [
                {
                    text: 'Alterar Colunas',
                    className: 'btn-alterar-colunas',
                    action: function (e, dt, node, config) {
                        self.CloseFilterByColumnsModal();
                        self.OpenFilterByColumnsModal();

                        if (self.AlterarColunasObject.LastAlterarColunasId)
                            self.RestartComboboxValue(self.AlterarColunasObject.LastAlterarColunasId, true);
                        else {
                            var groupByObject = self.AlterarColunasObject.GroupByObject;
                            var visibleColumns = self.AlterarColunasObject.DatatableColumns;

                            if (groupByObject)
                                self.UpdateGroupByColumns(groupByObject);

                            if (visibleColumns)
                                self.UpdateVisibleColumns(visibleColumns);

                            self.ResetAlterarColunasObject();
                        }
                    }
                },
                {
                    extend: 'excelHtml5',
                    title: 'BIM',
                    text: 'Exportar excel',
                    className: 'btn-exportar-excel',
                    exportOptions: {
                        columns: ':not(:first-child)' // ignora a primeira coluna
                    },
                    action: function (e, dt, button, config) {
                        $.fn.dataTable.ext.buttons.excelHtml5.action.call(this, e, dt, button, config);
                    },
                }
            ],
        }
    };

    self.ShowDataTable = function (datatableColumnsWithCategory) {
        var groupByObject = self.GetGroupByObject();
        var defaultDatatableOptions = self.GetDefaultDatatableOptions();
        var uniqueId = self.GenerateUniqueDatatableId();
        var shouldReturnGroupedList = (groupByObject);

        var dtTableInstance = null;
        if (shouldReturnGroupedList) {
            dtTableInstance = self.GetGroupByDatatableInstance(groupByObject.GroupByName, groupByObject.GroupByCategory, defaultDatatableOptions, datatableColumnsWithCategory);

        } else {
            dtTableInstance = self.GetDefaultDatatableInstance(defaultDatatableOptions, datatableColumnsWithCategory);
        }

        self._PropertiesFilterDatatable.push({
            id: uniqueId,
            instance: dtTableInstance
        });

        self.ShowDataTableLoader();
        setTimeout(function () {
            self.RemoveFilters();
            self.CreateFiltersForDatatableColumns();
            self.TransformCreatedColumnsIntoInputs();
            self.AppendFooterFiltersIntoThead();
            self.EnableSearchEvents();
            self.EnableCheckboxEvents();

            // Remover titles
            $('th').removeAttr("aria-label");

            // Resultados por página
            $("#tabela_filtros_length").css("float", "right");

            self.HideDataTableLoader();
            self.EnableResizeOnDatatable();
            self.EnableDatatableFixedFooter();

        }, 900);

        $("#filtrosDatatableArea").css("bottom", 0);
    };

    self.Visualizar3d = function () {
        var viewer = self.CUSTOM_VIEWER;
        self.UnselectAll(viewer);
        var filteredIds = self._ObjectsToSetVisibleArray;
        if (filteredIds)
            viewer.scene.setObjectsVisible(filteredIds, true)
    };

    self.Visualizar3dByArrayList = function (filteredIds) {
        var viewer = self.CUSTOM_VIEWER;
        self.UnselectAll(viewer);

        if (filteredIds)
            viewer.scene.setObjectsVisible(filteredIds, true)
    };

    self.GetSalvarVisaoCompartilhadaModalHtml = function (idVista, vistaNome) {
        var title = (idVista == 0) ? "Salvar visão compartilhada" : "Editar visão compartilhada";
        var customArea = (idVista == 0) ? `
            <div class="row">
                <div class="col-sm-12 no-padding">
                    <span class="defaultModalText">
                        Salve sua seleção como uma visão compartilhada e acesse por meio de um link de acesso rápido e compartilhável.
                    </span>
                </div>
            </div>
        ` : "";


        var html = `
            <div id="meuModal" class="modal-salvar-visao-compartilhada modal">
                <div class="modal-conteudo modal-conteudo-salvar-visao-compartilhada">
                    <div class="modal-header no-padding" style="padding-bottom: 16px !important;">
                        <span class="text">${title}</span>
                        <span class="fecharModalSalvarVisaoCompartilhada">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99972 8.94283L11.2996 12.2427L12.2424 11.2999L8.94253 8.00003L12.2424 4.70019L11.2996 3.75739L7.99972 7.05722L4.69989 3.75739L3.75708 4.70019L7.05691 8.00003L3.75708 11.2999L4.69989 12.2427L7.99972 8.94283Z" fill="#6F6F6F"/>
                            </svg>
                        </span>
                    </div>
                    <div class="modal-body">
                        ${customArea}
                        <div class="row" style="margin-top: 16px;">
                            <div class="col-sm-12 no-padding">
                                <div class="form-group position-relative">
                                    <input id="idVista" type="hidden" value="${idVista}">
                                    <input id="idOldName" type="hidden" value="${vistaNome}">
                                    <label for="nomeVisaoCompartilhada" class="select-label defaultModalText">Nome</label>
                                    <input id="nomeVisaoCompartilhada" type="text" class="form-control defaultModalText" autocomplete="off" value="${vistaNome}">
                                    <span  id="nomeVisaoCompartilhadaErrorAlert" class="hidden" style="color: tomato;">É necessário ter pelo menos 3 caracteres</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancelarModalSalvarVisaoCompartilhadaBtn">Cancelar</button>
                        <button id="salvarVisaoCompartilhadaBtn" class="btn-salvar-configuracoes active text-sm">
                            Continuar
                        </button>
                    </div>
                </div>
            </div>

        `;
        return html;
    };

    self.EnableEventsForSalvarVisaoCompartilhadaModal = function () {
        document.querySelector('.fecharModalSalvarVisaoCompartilhada').addEventListener('click', (event) => {
            self.CloseSalvarVisaoCompartilhadaModal();
        });

        document.querySelector('#cancelarModalSalvarVisaoCompartilhadaBtn').addEventListener('click', (event) => {
            self.CloseSalvarVisaoCompartilhadaModal();
        });

        self.EnableOkEventForSalvarVisaoCompartilhadaModal();
    };

    self.SalvarComoVisaoCompartilhada = function (idVista, vistaNome) {
        if (!idVista) idVista = 0;
        if (!vistaNome) vistaNome = "";

        self.Visualizar3d();
        var html = self.GetSalvarVisaoCompartilhadaModalHtml(idVista, vistaNome);

        $("#modalSalvarVisaoCompartilhada").html("");
        $("#modalSalvarVisaoCompartilhada").append(html);
        $(".modal.modal-salvar-visao-compartilhada").show();
        self.EnableEventsForSalvarVisaoCompartilhadaModal();
    };

    self.GetCopiarLinkIcon = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                <path d="M11.0833 2.75H5.25C4.6318 2.75 4.12591 3.23082 4.08588 3.83889H11.1611V10.9141C11.7692 10.8741 12.25 10.3682 12.25 9.75V3.91667C12.25 3.27233 11.7277 2.75 11.0833 2.75Z" fill="#161616"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.91667 12.0833H8.75V6.25H2.91667V12.0833ZM8.75 13.25C9.39433 13.25 9.91667 12.7277 9.91667 12.0833V6.25C9.91667 5.60567 9.39433 5.08333 8.75 5.08333H2.91667C2.27233 5.08333 1.75 5.60567 1.75 6.25V12.0833C1.75 12.7277 2.27233 13.25 2.91667 13.25H8.75Z" fill="#161616"/>
            </svg>
        `;
    };

    self.GetExclamationIconForLinkModal = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <g clip-path="url(#clip0_2057_6680)">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.99992 17.5002C14.1421 17.5002 17.4999 14.1423 17.4999 10.0002C17.4999 5.85803 14.1421 2.50016 9.99992 2.50016C5.85778 2.50016 2.49992 5.85803 2.49992 10.0002C2.49992 14.1423 5.85778 17.5002 9.99992 17.5002ZM9.99992 19.1668C15.0625 19.1668 19.1666 15.0628 19.1666 10.0002C19.1666 4.93755 15.0625 0.833496 9.99992 0.833496C4.93731 0.833496 0.833252 4.93755 0.833252 10.0002C0.833252 15.0628 4.93731 19.1668 9.99992 19.1668Z" fill="#834A09"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.16658 11.6668V5.00016H10.8333V11.6668H9.16658ZM9.16658 15.0002L9.16658 13.3335H10.8333L10.8333 15.0002H9.16658Z" fill="#834A09"/>
              </g>
              <defs>
                <clipPath id="clip0_2057_6680">
                  <rect width="20" height="20" fill="white"/>
                </clipPath>
              </defs>
            </svg>
        `;
    };

    self.GetCheckedIconForLinkModal = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0792 4.49586L5.54171 11.0333L1.9209 7.41252L2.74586 6.58757L5.54171 9.38342L11.2542 3.6709L12.0792 4.49586Z" fill="white"/>
            </svg>
        `;
    };

    self.GetLinkVisaoCompartilhadaModalHtml = function (link, idVista) {
        var html = `
            <div id="meuModal" class="modal-link-visao-compartilhada modal">
                <div class="modal-conteudo modal-conteudo-link-visao-compartilhada">
                    <div class="modal-header no-padding" style="padding-bottom: 16px !important;">
                        <span class="text">Link criado</span>
                        <span class="fecharModalLinkVisaoCompartilhada">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99972 8.94283L11.2996 12.2427L12.2424 11.2999L8.94253 8.00003L12.2424 4.70019L11.2996 3.75739L7.99972 7.05722L4.69989 3.75739L3.75708 4.70019L7.05691 8.00003L3.75708 11.2999L4.69989 12.2427L7.99972 8.94283Z" fill="#6F6F6F"/>
                            </svg>
                        </span>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-sm-12 no-padding">
                                <span class="strongModalText">Você já pode usá-lo como quiser!</span>
                                <br>
                                <span class="defaultModalText" style="margin-top: 8px;">
                                    Estará salvo na lista de "Visão compartilhada" no menu de ações do BIM.
                                </span>
                            </div>
                        </div>
                        <div class="row" style="margin-top: 20px;">
                            <div class="col-sm-11 no-padding">
                                <div class="form-group position-relative">
                                    <label for="linkVisaoCompartilhada" class="select-label">Link</label>
                                    <input id="linkVisaoCompartilhada" type="text" class="form-control defaultModalText" autocomplete="off" value="${link}">
                                </div>
                            </div>
                            <div class="col-sm-1 no-padding">
                                <span class="copiarLinkBtn" onclick="return _mainModel.CopyLinkToTransferArea()">${self.GetCopiarLinkIcon()}</span>
                            </div>
                        </div>
                        <div class="row" style="margin-top: 16px;">
                            <div class="linkModalAlert">
                                <span class="iconAlertArea">
                                    ${self.GetExclamationIconForLinkModal()}
                                </span>
                                <span class="textAlertArea">
                                    Apenas pessoas adicionadas no empreendimento e que tenham perfil com permissão para ver documentos conseguirão acessar o link
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancelarModalLinkVisaoCompartilhadaBtn">Fechar</button>
                        <button id="salvarLinkVisaoCompartilhadaBtn" class="btn-salvar-configuracoes active text-sm" onclick="return _mainModel.AcessarVisao(${idVista})">
                            Acessar visão
                        </button>
                    </div>
                </div>
            </div>

        `;
        return html;
    };

    self.CopyLinkToTransferArea = function () {
        $("#linkVisaoCompartilhada").click();

        var htmlIcon = self.GetCheckedIconForLinkModal();
        $(".copiarLinkBtn").html('')
        $(".copiarLinkBtn").css('background', '#4AA45F')
        $(".copiarLinkBtn").html(htmlIcon);

        setTimeout(function () {
            $('.copiarLinkBtn').removeAttr('style');
            $('.copiarLinkBtn').html('')
            $('.copiarLinkBtn').html(_mainModel.GetCopiarLinkIcon());

        }, 1500);
    };

    self.EnableCopyElementTextToTransferenceArea = function (cssElement, tooltipMessage) {
        $(cssElement).on('click', function (event) {
            event.stopPropagation();

            // Comportamento de copiar texto
            var textoParaCopiar = $(this).is('input, textarea') ? $(this).val() : $(this).text(); // Ajuste para pegar valor ou texto
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(textoParaCopiar).select();
            document.execCommand("copy");
            $temp.remove();

            // Tooltip informando que o texto foi copiado com sucesso
            var $tooltip = $('<div class="copy-content-to-transfer-area">' + tooltipMessage + '</div>');

            // Verificação se event.pageX e event.pageY estão disponíveis, caso contrário, usar valores baseados no botão .copiarLinkBtn
            var yCorrectionFactor = 40;
            var xCorrectionFactor = 50;

            // Posição padrão se evento for disparado programaticamente
            var $btnCopiarLink = $(".copiarLinkBtn"); // Encontrar o botão que você quer usar
            var mouseX, mouseY;

            if (event.pageX && event.pageY) {
                // Caso o clique seja manual
                mouseX = event.pageX;
                mouseY = event.pageY;
            } else {
                // Caso o clique seja programático, use a posição do botão .copiarLinkBtn
                mouseX = $btnCopiarLink.offset().left + ($btnCopiarLink.outerWidth() / 2); // Centraliza no botão
                mouseY = $btnCopiarLink.offset().top - 10; // Posição logo acima do botão
            }

            $("body").append($tooltip);
            $tooltip.css({ top: mouseY - yCorrectionFactor, left: mouseX - xCorrectionFactor }).fadeIn(100, function () {
                setTimeout(function () {
                    $tooltip.fadeOut(500, function () {
                        $(this).remove();
                    });
                }, 1000);
            });
        });
    };

    self.EnableEventsForlinkVisaoCompartilhadaModal = function () {
        document.querySelector('.fecharModalLinkVisaoCompartilhada').addEventListener('click', (event) => {
            self.CloseLinkVisaoCompartilhadaModal();
        });

        document.querySelector('#cancelarModalLinkVisaoCompartilhadaBtn').addEventListener('click', (event) => {
            self.CloseLinkVisaoCompartilhadaModal();
        });

        self.EnableCopyElementTextToTransferenceArea("#linkVisaoCompartilhada", "Texto copiado!");
    };

    self.OpenLinkVisaoCompartilhadaModal = function (model) {
        var link = model.LinkCompartilhamento;
        var html = self.GetLinkVisaoCompartilhadaModalHtml(link, model.Id);

        $("#modalCompartilharLinkVisaoCompartilhada").html("");
        $("#modalCompartilharLinkVisaoCompartilhada").append(html);
        $(".modal.modal-link-visao-compartilhada").show();
        self.EnableEventsForlinkVisaoCompartilhadaModal();
    };

    self.MesclarComOutraVersao = function () {
        alert("Não implementado.")
    };

    self.GetCloseButtonOnFecharAlerta3d = function () {
        return `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99996 8.94277L11.2998 12.2426L12.2426 11.2998L8.94277 7.99996L12.2426 4.70013L11.2998 3.75732L7.99996 7.05716L4.70013 3.75732L3.75732 4.70013L7.05716 7.99996L3.75732 11.2998L4.70013 12.2426L7.99996 8.94277Z" fill="#A7A7A7"/>
                            </svg>
                        `;
    };

    self.GetVisualizar3dHtml = function () {
        var arraySize = self.GetArraySize();
        var display = arraySize == 0 ? "none" : "flex";

        var html = `
            <span class="visualizarEm3dArea" style="display: ${display};">
            <span id="fecharAlerta3d" data-bs-placement="top" data-bs-toggle="tooltip" title="Descartar seleção" onclick="return _mainModel.FecharVisualizar3d(this)">${self.GetCloseButtonOnFecharAlerta3d()}</span>
                        <span>${arraySize} elemento(s) selecionado(s) </span>
            <button onclick="return _mainModel.Visualizar3d()">
                Visualizar no modelo
            </button>
                <button onclick="return _mainModel.SalvarComoVisaoCompartilhada()">
                Salvar como visão compartilhada
            </button>
        `;

        return html;
    };

    self.DesabilitarTodosCheckboxDatatableSemConsiderarPaginacao = function () {
        var table = $('#tabela_filtros').DataTable();
        table.rows().every(function (rowIdx, tableLoop, rowLoop) {
            var data = this.data();
            var rowNode = this.node();
            var elementId = data.id;
            var checkbox = $(rowNode).find('td:first-child input[type="checkbox"]');
            var elementId = data.id;

            if (elementId) {
                self.RemoveId(elementId);
            }

            checkbox.prop('checked', false);
        });

        $("#search_CheckBox").prop('checked', false);
        $("#search_Selecionar").prop('checked', false);
    };

    self.FecharVisualizar3d = function (elmt) {
        self.DesabilitarTodosCheckboxDatatableSemConsiderarPaginacao();
        $(elmt).parent().css("display", "none");
    };

    self.EnableCheckboxEvents = function () {
        $(".selectAllCheckBox").on("click", function (idx, elmt) {
            var isChecked = $(this)[0].checked;

            if (isChecked) {
                $("#tabela_filtros tbody tr td:first-child input").each(function () {
                    var elementId = $(this).parent().parent().attr("id");
                    elementId = self.GetRowObjectId(elementId);

                    self.AddId(elementId);

                    $(this).prop('checked', true);
                });

            } else {
                $("#tabela_filtros tbody tr td:first-child input").each(function () {
                    var elementId = $(this).parent().parent().attr("id");
                    elementId = self.GetRowObjectId(elementId);

                    self.RemoveId(elementId);

                    $(this).prop('checked', false);
                });
            }

            self.ShowVisualizar3dArea();
        });

        $("#tabela_filtros").on("click", ".selectCheckBox", function (idx, elmt) {
            var elementId = $(this).parent().parent().attr("id");
            elementId = self.GetRowObjectId(elementId);
            var isChecked = $(this)[0].checked;

            if (isChecked) {
                self.AddId(elementId);
            } else {
                self.RemoveId(elementId);
            }

            self.ShowVisualizar3dArea();
        });
    };

    self.ShowVisualizar3dArea = function () {
        var html = self.GetVisualizar3dHtml();
        $('.dataTables_length').find('span.visualizarEm3dArea').remove()
        $('.dataTables_length').append(html);
        self.EnableBootstrapTooltipForClass('#fecharAlerta3d');
    };

    self.GetRowObjectId = function (objectId) {
        if (objectId.includes('-')) {
            const parts = objectId.split('-');
            return parts[1];
        }
        else {
            return objectId;
        }
    };

    self.AddId = function (id) {
        if (!self._ObjectsToSetVisibleArray.includes(id)) {
            self._ObjectsToSetVisibleArray.push(id);
        }
    };

    self.RemoveId = function (id) {
        const index = self._ObjectsToSetVisibleArray.indexOf(id);
        if (index !== -1) {
            self._ObjectsToSetVisibleArray.splice(index, 1);
        }
    };

    self.ClearArray = function () {
        self._ObjectsToSetVisibleArray = [];
    };

    self.ContainsId = function (id) {
        return self._ObjectsToSetVisibleArray.includes(id);
    };

    self.GetArraySize = function () {
        return self._ObjectsToSetVisibleArray.length;
    };

    self.AddDashedBoxWhenMoving = function () {
        var tickedBox = $('.tickedBox');
        if (tickedBox) {
            tickedBox.remove();
            var movingBox = document.createElement('div');
            movingBox.className = 'tickedBox IsMoving';
            $("#colunasVisiveisArea").append(movingBox);
        }
    };

    self.RemoveDashedBoxWhenMovingFinished = function () {
        var movingBox = $('.IsMoving');
        if (movingBox) {
            movingBox.remove();
            var tickedBox = document.createElement('div');
            tickedBox.className = 'tickedBox';
            $("#colunasVisiveisArea").append(tickedBox);
        }
    };

    self.AddBorderOnGroupByAreaWhenNecessary = function (el) {
        var hasToChangeBackgroundFromGroupByArea = el.parentElement.id == "colunasVisiveisArea";
        if (hasToChangeBackgroundFromGroupByArea) {
            $('#groupByArea').css('background', "#F8F8F8");
        }
    };

    self.RemoveBorderOnGroupByArea = function () {
        $('#groupByArea').css('background', "#fff");
    };

    self.UpdateCardOrder = function (parentElement) {
        var cards = parentElement.querySelectorAll('.cardSection');
        cards.forEach(function (card, index) {
            var orderElement = card.querySelector('.order-number');
            if (!orderElement) {
                orderElement = document.createElement('span');
                orderElement.className = 'order-number';
                card.appendChild(orderElement);
            }
            orderElement.textContent = index + 1;
        });
    };

    self.RemoveOrderNumber = function (element) {
        var orderElement = element.querySelector('.order-number');
        if (orderElement) {
            orderElement.remove();
        }
    };

    self.EnableDragAndDropWithDragula = function (originId = 'todasAscolunasArea', destinyId = 'colunasVisiveisArea') {
        var origem = document.getElementById(originId);
        var destino = document.getElementById(destinyId);
        var groupBy = document.getElementById("groupByArea");
        var drake = dragula([origem, destino, groupBy], {
            accepts: function (el, target, source, sibling) {
                if (source === groupBy) {
                    return false;
                }

                return target === origem || target === destino || target === groupBy;
            },
            moves: function (el, source, handle, sibling) {
                if (handle.closest('.tickedBox, .IsMoving')) {
                    return false; // Do not allow dragging
                }
                return true; // Allow dragging otherwise
            }
        });

        drake.on('drag', function (el) {

            el.classList.add('is-moving');
            el.style.cursor = 'grabbing';
            self.AddDashedBoxWhenMoving();
            self.AddBorderOnGroupByAreaWhenNecessary(el);

        }).on('dragend', function (el) {

            el.classList.remove('is-moving');
            el.style.cursor = 'grab';
            self.RemoveDashedBoxWhenMovingFinished();
            self.RemoveBorderOnGroupByArea();

        }).on('drop', function (el, target, source, sibling) {
            if (target === destino) {

                self.ResetMarginsInDestino();
                self.AddAttrOnClick(el);
                self.UpdateCardOrder(destino);

            } else if (target === origem) {

                self.RemoveAttrOnClick(el);
                self.RemoveOrderNumber(el);
                self.UpdateCardOrder(destino);

            } else if (target === groupBy) {

                $(el).remove();
                self.AddGroupByOption(el);

                if (destino.firstChild) {
                    destino.insertBefore(el, destino.firstChild);
                } else {
                    destino.appendChild(el);
                }
            }
        });
    };

    self.ChangeButtonToPlus = function (el, target, source, sibling) {
        var id = $(el).attr("id");
        var newElement = $("#" + id).find('.minusButton');
        $(newElement).html('+');
        $(newElement).removeClass('minusButton');
        $(newElement).addClass('plusButton');
    };

    self.ChangeButtonToMinus = function (el, target, source, sibling) {
        var id = $(el).attr("id");
        var newElement = $("#" + id + '.gu-transit').find('.plusButton');
        $(newElement).html('-');
        $(newElement).removeClass('plusButton');
        $(newElement).addClass('minusButton');
    };

    self.ResetMarginsInDestino = function (destinyId = 'colunasVisiveisArea', cardClassName = 'cardSection') {
        var cards = document.getElementById(destinyId).getElementsByClassName(cardClassName);
        Array.from(cards).forEach(card => {
            card.classList.remove('over');
        });
    };

    self.EnableResizeOnDatatable = function () {
        $("#filtrosDatatableArea").resizable({
            handles: 'n', // 'n' permite o redimensionamento apenas na parte superior (norte),
            maxHeight: self.CalculateMaxHeight(90), // 90% da altura da janela do navegador
            minHeight: 125, // em pixels
            start: function (event, ui) {
                $(this).css('transition', 'none');
            },
            stop: function (event, ui) {
                $(this).css('transition', '300ms ease-in-out');
            }
        });
    };

    self.CalculateMaxHeight = function (percentage) {
        var windowHeight = $(window).height();
        return windowHeight * (percentage / 100);
    };

    self.GetAllVisibleInDatatableObjectsIds = function () {
        var visibleIds = [];
        $("#filtrosDatatable #tabela_filtros tbody tr").each(function () {
            var id = $(this).attr('id');
            if (id) {
                visibleIds.push(id.replace('row-', ''));
            }
        });
        return visibleIds;
    };

    self.HideDataTable = function () {
        self.ClearArray();
        $("#filtrosDatatableArea #loader").show();
        $("#filtrosDatatableArea").css("bottom", -1000);
        $("#filtrosDatatableArea").removeClass("minimized");
        $("#filtrosDatatableArea").css("top", "inherit");

        setTimeout(function () {
            if ($.fn.DataTable.isDataTable('#tabela_filtros')) {

                $('#tabela_filtros').DataTable().destroy();
                $("#tabela_filtros tfoot.totaisArea").empty();
                $("#tabela_filtros thead").empty();
                $("#tabela_filtros tbody").empty();
                self._PropertiesFilterDatatable = [];
                self.ShowDataTableLoader();
            }
        }, 900)
    };

    self.GetArrowUpIcon = function () {
        return `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99997 4.39062L14.4714 10.862L13.5286 11.8048L7.99997 6.27624L2.47137 11.8048L1.52856 10.862L7.99997 4.39062Z" fill="#A7A7A7"/>
                            </svg>
                        `;
    };

    self.GetArrowDownIcon = function () {
        return `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00021 11.6095L14.4716 5.13807L13.5288 4.19526L8.00021 9.72386L2.47162 4.19526L1.52881 5.13807L8.00021 11.6095Z" fill="#A7A7A7" />
                            </svg>
                        `;
    };

    self.MinimizarDatatable = function (elmnt) {
        var $icon = $(elmnt);
        var $div = $('#filtrosDatatableArea');
        var haveToShow = $div.hasClass("minimized");

        if (haveToShow) {
            $div.removeClass("minimized");
            $div.css("height", "50%");
            $div.css("top", "inherit");
            $icon.html("");
            $icon.html(self.GetArrowDownIcon());

        } else {
            $div.addClass("minimized");
            $div.css("height", "9%");
            $div.css("top", "inherit");
            $icon.html("");
            $icon.html(self.GetArrowUpIcon());
        }
    };

    self.SetLastAlterarColunasId = function () {
        var optionSelected = $("#selectConfiguracoesFiltrosSalvos").val();
        if (optionSelected)
            self.AlterarColunasObject.LastAlterarColunasId = optionSelected;
        else {
            var groupByObject = self.GetGroupByObject(false);
            var visibleColumnsObject = self.GetAllVisibleColumns(false);

            if (groupByObject)
                self.AlterarColunasObject.GroupByObject = [groupByObject];

            if (visibleColumnsObject)
                self.AlterarColunasObject.DatatableColumns = visibleColumnsObject;
        }
    }

    self.EnableOkEvent = function () {
        $("#salvar").on("click", function () {
            var $button = $(this);
            $button.text("Carregando...");
            $button.prop("disabled", true);
            $button.addClass("loading");

            self.SetLastAlterarColunasId();

            setTimeout(function () {
                var datatableColumns = self.GetAllVisibleColumns();
                self.ShowDataTable(datatableColumns);
            }, 350);
        });
    };

    self.ValidateOkEventForSalvarConfiguracaoFiltrosModal = function () {
        var response = true;
        var nome = $("#nomeConfiguracaoFiltro").val();
        if (nome) {
            $("#nomeConfiguracaoFiltro").css("border", "1px solid #ced4da");
        } else {
            $("#nomeConfiguracaoFiltro").css("border", "1px solid tomato");
            response = false;
        }
        return response;
    };

    self.ValidateOkEventForSalvarVisaoCompartilhadaModal = function () {
        var response = true;
        var nome = $("#nomeVisaoCompartilhada").val();

        if (nome.length < 3) {
            $("#nomeVisaoCompartilhada").css("border", "1px solid tomato");
            $("#nomeVisaoCompartilhadaErrorAlert").show()
            response = false;
        } else {
            $("#nomeVisaoCompartilhada").css("border", "1px solid #ced4da");
            $("#nomeVisaoCompartilhadaErrorAlert").hide();
        }

        return response;
    };

    self.ValidateOkEventForSalvarVisaoCompartilhadaModal = function () {
        var response = true;
        var nome = $("#nomeVisaoCompartilhada").val();

        if (nome.length < 3) {
            $("#nomeVisaoCompartilhada").css("border", "1px solid tomato");
            $("#nomeVisaoCompartilhadaErrorAlert").show()
            response = false;
        } else {
            $("#nomeVisaoCompartilhada").css("border", "1px solid #ced4da");
            $("#nomeVisaoCompartilhadaErrorAlert").hide();
        }

        return response;
    };

    self.ValidateOkEventForSalvarVisaoCompartilhadaModal = function () {
        var response = true;
        var nome = $("#nomeVisaoCompartilhada").val();

        if (nome.length < 3) {
            $("#nomeVisaoCompartilhada").css("border", "1px solid tomato");
            $("#nomeVisaoCompartilhadaErrorAlert").show()
            response = false;
        } else {
            $("#nomeVisaoCompartilhada").css("border", "1px solid #ced4da");
            $("#nomeVisaoCompartilhadaErrorAlert").hide();
        }

        return response;
    };

    self.ContainsSpecialChars = function (text) {
        const specialCharRegex = /[#@@!\-_]/;
        return specialCharRegex.test(text);
    };

    self.EnableOkEventForSalvarConfiguracaoFiltrosModal = function () {
        $("#salvarModeloFiltroBtn").on("click", function () {
            // Dados e validação das configurações
            var visibleColumns = self.GetVisibleColumns();
            var groupByColumns = self.GetGroupByColumnns();
            if (visibleColumns.length == 0 && groupByColumns.length == 0) {
                self.ShowWarningAlert("Por favor, selecione ao menos uma coluna para continuar.")
                return;
            }

            // Validação do modal
            var isValid = self.ValidateOkEventForSalvarConfiguracaoFiltrosModal();
            if (!isValid) {
                self.ShowWarningAlert("Por favor, Preencha todos os campos obrigatórios.");
                return;
            }

            // Adicionar validação para o nome
            var nome = $("#nomeConfiguracaoFiltro").val();
            var possuiCaractereEspecial = self.ContainsSpecialChars(nome);
            if (possuiCaractereEspecial) {
                self.ShowWarningAlert("O nome inserido contém caracteres não permitidos. Evite usar caracteres especiais como #, @@, !, -, _.");
                return;
            }

            // Prepara dados para POST
            var csvContent = self.GetCsvContent(visibleColumns, groupByColumns);
            var visibilidade = self.GetVisibilidadeSelecionada();
            var postData = {
                IdUsuarioCriacao: self.IdUsuario,
                IdObra: self.IdObra,
                Nome: nome,
                Visibilidade: visibilidade,
                CsvContent: csvContent,
            };

            // POST
            var $button = $(this);
            $button.text("Carregando...");
            $button.prop("disabled", true);
            $button.addClass("loading");

            setTimeout(function () {
                $.post(`/Filtro/SalvarConfiguracaoFiltros`, postData, function (response) {
                    if (!response.Success) {
                        self.ShowErrorAlert(response.Message);
                        return;
                    }

                    self.CloseSalvarConfiguracaoFiltroModal();
                    $("#selectConfiguracoesFiltrosSalvos").html("")
                    $("#selectConfiguracoesFiltrosSalvos").html(response.Data)
                    self.ShowSuccessAlert();

                }).fail(function (jqXHR, textStatus, errorThrown) {

                    console.log(`Erro na requisição: (${jqXHR.status}) - ${textStatus}`, errorThrown);
                    self.ShowErrorAlert("Ocorreu um erro ao salvar as configurações do filtro. Por favor, tente novamente.");

                }).always(function () {
                    $button.text("Salvar");
                    $button.prop("disabled", false);
                    $button.removeClass("loading");
                })
            }, 350);
        });
    };

    self.GetAllIdsPlantaFromUrl = function () {
        var idsTodasPlantas = self.GetUrlParamValue('idPlantas')
        if (idsTodasPlantas && idsTodasPlantas.length > 0)
            return idsTodasPlantas;
    };

    self.GetViewerObjectsWithName = function () {
        var response = [];

        try {
            var table = $('#tabela_filtros').DataTable();
            var allSelectedObjectsSet = new Set(self._ObjectsToSetVisibleArray);
            var rowsData = table.rows().data();

            rowsData.each(function (data, index) {
                var elementId = data.id;
                var elementName = data.name || data[1];
                if (!elementName) elementName = data["Element Name"]; // SE A TABELA ESTIVER EM GROUP BY

                if (allSelectedObjectsSet.has(elementId)) {
                    response.push({
                        elementId: elementId,
                        elementName: elementName
                    });
                }
            });

        } catch { }

        return response;
    };

    self.RefreshVisaoCompartilhadaArea = function () {
        if ($("#visao_compartilhada_button").hasClass('active')) {
            self.GetAllVistasModalHtml();
        }
    };

    self.EnableOkEventForSalvarVisaoCompartilhadaModal = function () {
        $("#salvarVisaoCompartilhadaBtn").on("click", function () {
            // Validação do modal
            var isValid = self.ValidateOkEventForSalvarVisaoCompartilhadaModal();
            if (!isValid) return;

            var idVista = $("#idVista").val();
            if (idVista == 0) {
                if (self._ObjectsToSetVisibleArray == null || self._ObjectsToSetVisibleArray.length == 0) {
                    self.ShowWarningAlert("Selecione ao menos um elemento para ser salvo!");
                    return;
                }
            }

            var $button = $(this);
            $button.html('<i style="margin-right: 4px;" class="fas fa-circle-notch fa-spin"></i> Continuar');
            $button.prop("disabled", true);
            $button.addClass("loading");

            // POST
            var postData = {
                idUsuario: self.IdUsuario,
                idObra: self.IdObra,
                nomeVista: $("#nomeVisaoCompartilhada").val(),
                viewerObjectsArray: self.GetViewerObjectsWithName(),
                idsPlantas: self.GetAllIdsPlantaFromUrl(),
                idVista: parseInt(idVista),
                idPlantaURL: self.GetActivePlantaId()
            };

            var nomeAntesUpdate = $("#idOldName").val();

            setTimeout(function () {
                $.post(`/Vista/Persist`, postData, function (response) {

                    if (!response.Success) {
                        self.ShowErrorAlert(response.Message);
                        return;
                    }
                    self.CloseSalvarVisaoCompartilhadaModal();
                    if (postData.idVista > 0) {
                        var nomeAtual = response.Data.Nome;
                        self.ShowSuccessToastMessage('Visão compartilhada editada!', `De ${nomeAntesUpdate} para ${nomeAtual}`);
                    } 

                    self.OpenLinkVisaoCompartilhadaModal(response.Data);
                    self.RefreshVisaoCompartilhadaArea();


                }).fail(function (jqXHR, textStatus, errorThrown) {
                    
                    self.ShowErrorAlert("Ocorreu um erro ao salvar as configurações de vista. Tente novamente e se o erro continuar, por favor, reporte um issue");

                }).always(function () {
                    $button.text("Continuar");
                    $button.prop("disabled", false);
                    $button.removeClass("loading");
                })
            }, 350);
        });
    };

    self.AcessarVisao = function (idVista, timeout) {
        if (!timeout) timeout = 1500;

        self.CloseLinkVisaoCompartilhadaModal();
        self.HideDataTable();

        if (!$("#visao_compartilhada_button").hasClass('active')) {
            $("#visao_compartilhada_button").click();

            setTimeout(function () {
                $("#option_" + idVista).find("input").click();
                $("#option_" + idVista).find("input").prop("checked", true);

            }, timeout);

        } else {
            $("#option_" + idVista).find("input").click();
            $("#option_" + idVista).find("input").prop("checked", true);
        }
    };

    self.HabilitarCheckboxAoClicarNoCard = function () {
        $('#PlantasParaSeremFederadasSection .cardSection').on("click", function () {
            var $this = $(this).find('span > input');
            if ($this[0].checked) {
                $this.removeAttr("checked");
            } else {
                $this.attr("checked", "checked");
            }
        });
    };

    self.ReloadWindowWithNewURL = function (idsToFilter) {
        // Construir a nova URL com os parâmetros
        let baseUrl = window.location.origin + window.location.pathname;
        let params = new URLSearchParams(window.location.search);
        let originalIdPlanta = params.get('idplanta');

        // Manter apenas os parâmetros especificados
        let allowedParams = ['idObra', 'token', 'idplanta'];
        let newParams = new URLSearchParams();
        allowedParams.forEach(param => {
            if (params.has(param)) {
                newParams.set(param, params.get(param));
            }
        });

        // Remover o idPlanta original da lista de idsToFilter, se presente
        if (originalIdPlanta) {
            idsToFilter = idsToFilter.filter(id => id !== originalIdPlanta);
        }

        // Adicionar os novos idsPlantas
        idsToFilter.forEach(id => {
            newParams.append('idPlantas', id);
        });

        // Redirecionar para a nova URL
        window.location.href = `${baseUrl}?${newParams.toString()}`;
    };

    self.ReloadWindowWithNewURLVisaoCompartilhada = function (chaveCompartilhamento) {
        // Construir a nova URL com os parâmetros
        let baseUrl = window.location.origin + window.location.pathname;
        let params = new URLSearchParams(window.location.search);
        let originalIdPlanta = params.get('idplanta');

        // Manter apenas os parâmetros especificados
        let allowedParams = ['idObra', 'token', 'idplanta'];
        let newParams = new URLSearchParams();
        allowedParams.forEach(param => {
            if (params.has(param)) {
                newParams.set(param, params.get(param));
            }
        });

        newParams.append('chaveCompartilhamento', chaveCompartilhamento);

        // Redirecionar para a nova URL
        window.location.href = `${baseUrl}?${newParams.toString()}`;
    };


    self.SearchFederarArquivos = function () {
        var filter = $("#modalFederarArquivos .search-container input.search-input").val().toLowerCase().trim();
        var hasVisibleElements = false;
        var selectedElements = $("#PlantasParaSeremFederadasSection .cardSection input[type='checkbox']:checked").closest('.cardSection');
        var unselectedElements = $("#PlantasParaSeremFederadasSection .cardSection input[type='checkbox']:not(:checked)").closest('.cardSection');

        unselectedElements.each(function () {
            var element = $(this);
            var proprietyName = element.find('.propertyName').html().toLowerCase().trim();

            if (!filter || proprietyName.includes(filter)) {
                element.show();
                hasVisibleElements = true;
            } else {
                element.hide();
            }
        });

        if (hasVisibleElements) {
            $("#NenhumRegistroEncontrado").hide();
        } else {

            $("#NenhumRegistroEncontrado").show();
        }

        var hrElement = $("#selectedItemsSeparator");
        selectedElements.insertAfter(hrElement).show();
    };

    self.EnableSearchEventForModalFederarArquivo = function () {
        $("#modalFederarArquivos .search-container input.search-input").on("keyup", function () {
            self.SearchFederarArquivos();
        });

        $("#disciplineSelect").on("change", function () {
            var filter = $("#disciplineSelect option:selected").text().toLowerCase().trim();

            $("#PlantasParaSeremFederadasSection .cardSection .modal-title-area").each(function () {
                var element = $(this);
                var parentElement = $(element).parent();
                var proprietyCategory = $(element).find('.propertyCategory').text().toLowerCase().trim();
                proprietyCategory = proprietyCategory.replace("disciplina: ", "");

                if (!filter || filter == "todas") {
                    $(parentElement).show();
                    return;
                }

                if (proprietyCategory.includes(filter))
                    $(parentElement).show();
                else
                    $(parentElement).hide();
            });

        });
    };

    self.EnableEventsForFederarArquivosModal = function () {
        document.querySelector('.fecharModalFederarArquivos').addEventListener('click', (event) => {
            self.CloseFederarArquivosModal();
        });

        document.querySelector('#cancelarModalFederarArquivosBtn').addEventListener('click', (event) => {
            self.CloseFederarArquivosModal();
        });

        document.querySelector('#federarArquivosBtn').addEventListener('click', (event) => {

            var $button = $(this);
            $button.text("Carregando...");
            $button.prop("disabled", true);
            $button.addClass("loading");

            setTimeout(async function () {
                let idsToFilter = [];
                document.querySelectorAll('#PlantasParaSeremFederadasSection .cardSection').forEach(function (card) {
                    let checkbox = card.querySelector('input[type="checkbox"]');
                    if (checkbox.checked) {
                        idsToFilter.push(card.id);
                    }
                });

                if (!idsToFilter || idsToFilter.length == 0) {
                    $button.text("Federar arquivos");
                    $button.prop("disabled", false);
                    $button.removeClass("loading");
                    self.ShowWarningAlert("Por favor, selecione ao menos um documento para continuar.")
                    return;
                }

                var allFiles = await self.GetAllArquivosFederados();
                allFiles = allFiles.filter(item => idsToFilter.includes(item.planta_id.toString()));
                self.ReloadWindowWithNewURL(idsToFilter);
            }, 350);
        });

        self.TrazerModelosCarregadosSelecionados();
        self.HabilitarCheckboxAoClicarNoCard();
        self.EnableSearchEventForModalFederarArquivo();
    };

    self.TrazerModelosCarregadosSelecionados = function () {
        var documentsToSetSelected = []
        $("#treeViewer ul li span").each(function () {
            documentsToSetSelected.push($(this).text().trim());
        });

        $("#PlantasParaSeremFederadasSection .cardSection").each(function () {
            var $this = $(this);
            var value = $this.find('.modal-title-area .propertyName').text();

            if (documentsToSetSelected.includes(value)) {
                $this.find('span.icon input').attr("checked", "checkd");
            }
        });
    };

    self.GetMenuHamburguerSVG = function () {
        return `
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.6667 6.91667H2.33337V5.75H11.6667V6.91667ZM2.33337 8.08333H11.6667V9.25H2.33337V8.08333Z" fill="#A7A7A7"/>
                            </svg>
                        `;
    };

    self.UpdateVisibleColumns = function (columns) {
        var $area = $("#colunasVisiveisArea");
        $area.empty();
        columns.forEach(function (col) {
            var card = $('<div class="cardSection"></div>');
            card.append(self.GetMenuHamburguerArea());
            card.append('<div class="modal-title-area"><span class="propertyCategory">' + col.category + '</span><span class="propertyName">' + col.name + '</span></div>');
            $area.append(card);
        });
        self.UpdateCardOrder($("#colunasVisiveisArea")[0])
    };

    self.UpdateGroupByColumns = function (columns) {
        var $area = $("#groupByArea");
        $area.empty();
        self.HideTickedBorder();
        columns.forEach(function (col) {
            var card = $('<div class="groupByCard"></div>');
            card.append('<span class="groupByCategory">' + col.category + '</span>');
            card.append('<span class="groupByName">' + col.name + '</span>');
            card.append('<span class="groupByCloseIcon" onclick="return _mainModel.FecharGroupByOption(this)">x</span>');
            $area.append(card);
        });

        if (columns.length == 0) {
            self.ShowTickedBorder();
            return;
        }
    };

    self.Process = function (contents) {
        var lines = contents.split("\n");
        var section = "";
        var visibleColumns = [];
        var groupByColumns = [];
        var notFoundColumns = [];
        var isValidCsv = false;
        var allOptions = self.GetAllFilterOptions();

        // Validação
        if (lines.length > 0) {
            if (lines[0].trim() === "Visible Columns") {
                isValidCsv = true;
            }
        }
        if (!isValidCsv) {
            self.ShowWarningAlert("Não conseguimos importar os filtros a partir do csv disponibilizado");
            return;
        }

        lines.forEach(function (line) {
            line = line.trim();
            if (line === "Visible Columns") {
                section = "visible";
            } else if (line === "Group By Columns") {
                section = "groupBy";
            } else if (line.length > 0) {
                var parts = line.split(",");
                var column = { category: parts[0], name: parts[1] };
                if (section === "visible") {
                    visibleColumns.push(column);
                } else if (section === "groupBy") {
                    groupByColumns.push(column);
                }
            }
        });

        // Filtrar colunas que existem em allOptions
        visibleColumns = visibleColumns.filter(function (col) {
            var exists = allOptions.some(function (option) {
                return option.Name === col.name && option.Category === col.category;
            });
            if (!exists) {
                notFoundColumns.push(col);
            }
            return exists;
        });

        groupByColumns = groupByColumns.filter(function (col) {
            var exists = allOptions.some(function (option) {
                return option.Name === col.name && option.Category === col.category;
            });
            if (!exists) {
                notFoundColumns.push(col);
            }
            return exists;
        });

        // Atualizar a interface com as colunas importadas
        self.UpdateVisibleColumns(visibleColumns);
        self.UpdateGroupByColumns(groupByColumns);

        // Exibir mensagem de feedback com as propriedades não encontradas no modelo
        if (notFoundColumns.length > 0) {
            var message = "As seguintes propriedades não foram encontradas no modelo: \n";
            notFoundColumns.forEach(function (col) {
                message += col.category + ": " + col.name + "\n";
            });
            self.ShowWarningAlert(message);
        }
    };

    self.GetVisibleColumns = function () {
        var visibleColumns = [];
        $("#colunasVisiveisArea .cardSection").each(function () {
            var category = $(this).find(".propertyCategory").text();
            var name = $(this).find(".propertyName").text();
            visibleColumns.push({ category: category, name: name });
        });
        return visibleColumns;
    };

    self.GetGroupByColumnns = function () {
        var groupByColumns = [];
        $("#groupByArea .groupByCard").each(function () {
            var category = $(this).find(".groupByCategory").text();
            var name = $(this).find(".groupByName").text();
            groupByColumns.push({ category: category, name: name });
        });
        return groupByColumns;
    };

    self.GetCsvContent = function (visibleColumns, groupByColumns) {
        var csvContent = "Visible Columns\n";
        visibleColumns.forEach(function (col) {
            csvContent += col.category + "," + col.name + "\n";
        });
        csvContent += "\nGroup By Columns\n";
        groupByColumns.forEach(function (col) {
            csvContent += col.category + "," + col.name + "\n";
        });
        return csvContent;
    };

    self.EnableImportarExportarEvent = function () {
        $("#importarCfgButton").on("click", function () {
            var fileInput = $('<input type="file" accept=".csv">');
            fileInput.on("change", function (event) {
                var file = event.target.files[0];
                if (file) {
                    var fileName = file.name;
                    var fileExtension = fileName.split('.').pop().toLowerCase();

                    if (fileExtension !== 'csv') {
                        self.ShowWarningAlert("Por favor, envie um arquivo CSV válido.");
                        return;
                    }

                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var contents = e.target.result;
                        self.Process(contents);
                    };
                    reader.readAsText(file);
                }
            });
            fileInput.click();
        });

        $("#exportarCfgButton").on("click", function () {
            var visibleColumns = self.GetVisibleColumns();
            var groupByColumns = self.GetGroupByColumnns();

            if (visibleColumns.length == 0 && groupByColumns.length == 0) {
                self.ShowWarningAlert("Por favor, selecione ao menos uma coluna para continuar.")
                return;
            }

            var csvContent = "data:text/csv;charset=utf-8,";
            csvContent += self.GetCsvContent(visibleColumns, groupByColumns);

            // Criar link para download
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "configuracao.csv");
            document.body.appendChild(link);
            link.click();
        });
    };

    self.CallGetCsvContentByIdConfig = function (idConfig) {
        $.get('/Filtro/GetCsvContentByIdConfig', { idConfig: idConfig }, function (response) {
            if (response.Success) {
                self.Process(response.Data);
            } else {
                self.ShowWarningAlert("Erro: " + response.Message);
            }
        }).always(function () {

        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.log(`Erro na requisição: (${jqXHR.status}) - ${textStatus}`, errorThrown);
            self.ShowErrorAlert("Ocorreu um erro ao recuperar as configurações do csv. Por favor, tente novamente.");
        });
    };

    self.EnableSalvarModeloButton = function () {
        $('.salvarConfiguracaoFiltroBtn').removeClass('disabled-salvar-modelo-btn');
    };

    self.DisableSalvarModeloButton = function () {
        $('.salvarConfiguracaoFiltroBtn').addClass('disabled-salvar-modelo-btn');
    };

    self.DisableCheckBoxDefinirComoModeloPadrao = function () {
        $('#abrirModeloPadraoArea span input#checkboxAbrirModeloPadrao').addClass('disabled-input-checkbox');
        $('#abrirModeloPadraoArea span.abrirModeloPadraoText ').addClass('disabled-text');
    };

    self.EnableCheckBoxDefinirComoModeloPadrao = function () {
        $('#abrirModeloPadraoArea span input#checkboxAbrirModeloPadrao').removeClass('disabled-input-checkbox');
        $('#abrirModeloPadraoArea span.abrirModeloPadraoText ').removeClass('disabled-text');
    };

    self.EnableConfiguracaoFiltrosChangeEvent = function () {
        $("#selectConfiguracoesFiltrosSalvos").on("change", function () {
            var $elmnt = $(this);
            var idConfig = $elmnt.val();
            $("#checkboxAbrirModeloPadrao").prop('checked', false);
            if (idConfig) {
                self.CallGetCsvContentByIdConfig(idConfig);
                self.EnableCheckBoxDefinirComoModeloPadrao();
                self.DisableSalvarModeloButton();
            } else {

                self.EnableSalvarModeloButton();
            }
        });
    };

    self.EnableCheckBoxFiltroPadraoClickEvent = function () {
        $("#checkboxAbrirModeloPadrao").on("click", function () {
            if ($(this).prop('checked')) {

                var selectOptionsValue = $("#selectConfiguracoesFiltrosSalvos").val();
                if (!selectOptionsValue || selectOptionsValue <= 0) {
                    self.ShowWarningAlert("Selecione qual modelo deseja exibir por padrão.")
                    $(this).prop('checked', false);
                    self.CookieUtil.Delete("DefaultOption");
                    self.DisableCheckBoxDefinirComoModeloPadrao();
                    return;
                }

                var oldValue = self.CookieUtil.Get("DefaultOption");
                var newValue = selectOptionsValue;
                if (oldValue != newValue) {
                    self.CookieUtil.Set("DefaultOption", newValue);
                }

            } else {
                self.CookieUtil.Delete("DefaultOption");
            }
        });
    };

    self.ResetAlterarColunasObject = function () {
        self.AlterarColunasObject = {
            LastAlterarColunasId: null,
            GroupByObject: null,
            DatatableColumns: null
        };
    };

    self.EnableEventsForModal = function () {
        document.querySelector('.fecharModalFiltros').addEventListener('click', (event) => {
            self.ResetAlterarColunasObject();
            self.CloseFilterByColumnsModal();
        });

        document.querySelector('#cancelarModalFiltros').addEventListener('click', (event) => {
            self.ResetAlterarColunasObject();
            self.CloseFilterByColumnsModal();
        });

        self.EnableModalSearchEvent();

        self.EnableOkEvent();

        self.EnableDragAndDropWithDragula();

        self.EnableImportarExportarEvent();

        self.EnableConfiguracaoFiltrosChangeEvent();

        self.EnableBootstrapTooltipForClass('.groupByTooltip');

        self.EnableCheckBoxFiltroPadraoClickEvent();

        self.EnableSelect2ForConfiguracaoFiltros();

    };

    self.EnableSelect2ForConfiguracaoFiltros = function () {
        var options = {
            templateResult: self.FormatSelect2ForConfiguracaoFiltrosSalvos,
            templateSelection: self.FormatSelect2ForConfiguracaoFiltrosSalvos,
            minimumResultsForSearch: 10
        }

        self.ConfigureSelect2('#selectConfiguracoesFiltrosSalvos', options);
    };

    self.FormatSelect2ForConfiguracaoFiltrosSalvos = function (state) {
        if (!state.id) {
            return state.text;
        }
        var text = state.text;
        var formattedText = text.replace(/##(.*?)##/g, '<strong>$1</strong>');
        return $('<span>' + formattedText + '</span>');
    };

    self.ConfigureSelect2 = function (elementHierarchyString, options) {
        $(elementHierarchyString).select2(options);

    };

    self.EnableEventsForSalvarConfiguracaoFiltrosModal = function () {
        document.querySelector('.fecharModalSalvarConfiguracaoFiltros').addEventListener('click', (event) => {
            self.CloseSalvarConfiguracaoFiltroModal();
        });

        document.querySelector('#cancelarModalSalvarConfiguracaoFiltrosBtn').addEventListener('click', (event) => {
            self.CloseSalvarConfiguracaoFiltroModal();
        });

        self.EnableOkEventForSalvarConfiguracaoFiltrosModal();

        self.EnableSetVisibilidadeModalEvent();

        self.EnableBootstrapTooltipForClass('.optionArea label.btn');
    };

    self.RestartComboboxValue = function (val, disparaEvento = false) {
        if (disparaEvento)
            $("#selectConfiguracoesFiltrosSalvos").val(val).trigger('change');
        else
            $("#selectConfiguracoesFiltrosSalvos").val(val);

        self.EnableSelect2ForConfiguracaoFiltros();
    };

    self.GetDefaultOptionColumnsByCookie = function () {
        var cookieValue = self.CookieUtil.Get("DefaultOption");
        if (cookieValue) {
            self.CallGetCsvContentByIdConfig(cookieValue);
            self.EnableCheckBoxDefinirComoModeloPadrao();
            self.RestartComboboxValue(cookieValue);
        } else {
            self.RestartComboboxValue('');
            self.EnableSalvarModeloButton();
        }
    };

    self.OpenFilterByColumnsModal = function () {
        self.HideDataTable();

        var html = self.GetFilterByColumnsModalHtml();
        $("#modalFiltros").html("");
        $("#modalFiltros").append(html);
        $(".modal.modal-filtros-por-coluna").show();
        self.EnableEventsForModal();
        self.GetDefaultOptionColumnsByCookie();
    };

    self.OpenFederarArquivosModal = async function () {
        var html = await self.GetFederarArquivosModalHtml();
        $("#modalFederarArquivos").html("");
        $("#modalFederarArquivos").append(html);
        $(".modal.modal-federar-arquivos").show();
        self.EnableEventsForFederarArquivosModal();
    };

    self.OpenSalvarConfiguracaoFiltrosModal = function () {
        var html = self.GetSalvarConfiguracaoFiltrosModalHtml();

        $("#modalSalvarconfiguracaoFiltros").html("");
        $("#modalSalvarconfiguracaoFiltros").append(html);
        $(".modal.modal-salvar-configuracao-filtro").show();
        self.EnableEventsForSalvarConfiguracaoFiltrosModal();


    };

    self.GetAllFilterOptions = function () {
        var filterOptions = [];
        var uniqueTracker = {};
        var objects = self.CUSTOM_VIEWER.scene.objects;
        var defaultValues = [
            { Name: "Document Name", Category: "System Default", Id: -1 },
            { Name: "Common Type", Category: "System Default", Id: -2 }
        ];
        for (var objectId in objects) {
            var objectType = self.GetMetaDataFromObject(objectId);
            var propertySets = objectType.propertySets;

            if (propertySets) {
                // Propriedades do objeto
                for (var propertySet in propertySets) {
                    propertySet = propertySets[propertySet];
                    if (propertySet.properties) {
                        // Propriedades das propriedades do objeto
                        for (var property in propertySet.properties) {
                            property = propertySet.properties[property];
                            var uniqueKey = `${propertySet.name}:${property.name}`;
                            if (!uniqueTracker[uniqueKey]) {
                                filterOptions.push({
                                    "Name": property.name,
                                    "Category": propertySet.name,
                                    "Id": propertySet.id
                                });
                                uniqueTracker[uniqueKey] = true;
                            }
                        }
                    }
                }
            }
        }

        // Ordenação por Category, depois por Name
        if (filterOptions) {
            filterOptions.sort((a, b) => {
                if (a.Category === b.Category) {
                    return a.Name.localeCompare(b.Name);
                }
                return a.Category.localeCompare(b.Category);
            });
        }

        filterOptions.unshift(...defaultValues);

        return filterOptions;
    };

    self.GetArrowLeftPaginationSvg = function () {
        return `
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M3.2583 7L8.92078 1.33752L9.74574 2.16247L4.90822 7L9.74574 11.8375L8.92078 12.6625L3.2583 7Z" fill="#A7A7A7"/>
                            </svg>
                        `;
    };

    self.GetArrowRightPaginationSvg = function () {
        return `
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.7417 7L5.07922 1.33752L4.25426 2.16247L9.09178 7L4.25426 11.8375L5.07922 12.6625L10.7417 7Z" fill="#6F6F6F"/>
                            </svg>
                        `;
    };

    self.GetDatatableLanguageOptions = function () {
        return {
            "emptyTable": `${self.GetExclamationIcon()} <strong>Nenhum registro encontrado</strong>`,
            "info": "Exibindo de _START_ até _END_ de _TOTAL_ registros",
            "infoFiltered": "(Filtrados de _MAX_ registros)",
            "infoThousands": ".",
            "loadingRecords": "Carregando...",
            "zeroRecords": "Nenhum registro encontrado",
            "search": "Pesquisar",
            "paginate": {
                "next": self.GetArrowRightPaginationSvg(),
                "previous": self.GetArrowLeftPaginationSvg(),
                "first": "Primeiro",
                "last": "Último"
            },
            "aria": {
                "sortAscending": ": Ordenar colunas de forma ascendente",
                "sortDescending": ": Ordenar colunas de forma descendente"
            },
            "select": {
                "rows": {
                    "_": "Selecionado %d linhas",
                    "1": "Selecionado 1 linha"
                },
                "cells": {
                    "1": "1 célula selecionada",
                    "_": "%d células selecionadas"
                },
                "columns": {
                    "1": "1 coluna selecionada",
                    "_": "%d colunas selecionadas"
                }
            },
            "buttons": {
                "copySuccess": {
                    "1": "Uma linha copiada com sucesso",
                    "_": "%d linhas copiadas com sucesso"
                },
                "collection": "Coleção  <span class=\"ui-button-icon-primary ui-icon ui-icon-triangle-1-s\"><\/span>",
                "colvis": "Visibilidade da Coluna",
                "colvisRestore": "Restaurar Visibilidade",
                "copy": "Copiar",
                "copyKeys": "Pressione ctrl ou u2318 + C para copiar os dados da tabela para a Área de transferência do sistema. Para cancelar, clique nesta mensagem ou pressione Esc..",
                "copyTitle": "Copiar para a área de transferência",
                "csv": "CSV",
                "excel": "Excel",
                "pageLength": {
                    "-1": "Mostrar todos os registros",
                    "_": "Mostrar %d registros"
                },
                "pdf": "PDF",
                "print": "Imprimir",
                "createState": "Criar estado",
                "removeAllStates": "Remover todos os estados",
                "removeState": "Remover",
                "renameState": "Renomear",
                "savedStates": "Estados salvos",
                "stateRestore": "Estado %d",
                "updateState": "Atualizar"
            },
            "autoFill": {
                "cancel": "Cancelar",
                "fill": "Preencher todas as células com",
                "fillHorizontal": "Preencher células horizontalmente",
                "fillVertical": "Preencher células verticalmente"
            },
            "lengthMenu": "_MENU_",
            "searchBuilder": {
                "add": "Adicionar Condição",
                "button": {
                    "0": "Construtor de Pesquisa",
                    "_": "Construtor de Pesquisa (%d)"
                },
                "clearAll": "Limpar Tudo",
                "condition": "Condição",
                "conditions": {
                    "date": {
                        "after": "Depois",
                        "before": "Antes",
                        "between": "Entre",
                        "empty": "Vazio",
                        "equals": "Igual",
                        "not": "Não",
                        "notBetween": "Não Entre",
                        "notEmpty": "Não Vazio"
                    },
                    "number": {
                        "between": "Entre",
                        "empty": "Vazio",
                        "equals": "Igual",
                        "gt": "Maior Que",
                        "gte": "Maior ou Igual a",
                        "lt": "Menor Que",
                        "lte": "Menor ou Igual a",
                        "not": "Não",
                        "notBetween": "Não Entre",
                        "notEmpty": "Não Vazio"
                    },
                    "string": {
                        "contains": "Contém",
                        "empty": "Vazio",
                        "endsWith": "Termina Com",
                        "equals": "Igual",
                        "not": "Não",
                        "notEmpty": "Não Vazio",
                        "startsWith": "Começa Com",
                        "notContains": "Não contém",
                        "notStartsWith": "Não começa com",
                        "notEndsWith": "Não termina com"
                    },
                    "array": {
                        "contains": "Contém",
                        "empty": "Vazio",
                        "equals": "Igual à",
                        "not": "Não",
                        "notEmpty": "Não vazio",
                        "without": "Nâo possui"
                    }
                },
                "data": "Data",
                "deleteTitle": "Excluir regra de filtragem",
                "logicAnd": "E",
                "logicOr": "Ou",
                "title": {
                    "0": "Construtor de Pesquisa",
                    "_": "Construtor de Pesquisa (%d)"
                },
                "value": "Valor",
                "leftTitle": "Critérios Externos",
                "rightTitle": "Critérios Internos"
            },
            "searchPanes": {
                "clearMessage": "Limpar Tudo",
                "collapse": {
                    "0": "Painéis de Pesquisa",
                    "_": "Painéis de Pesquisa (%d)"
                },
                "count": "{total}",
                "countFiltered": "{shown} ({total})",
                "emptyPanes": "Nenhum Painel de Pesquisa",
                "loadMessage": "Carregando Painéis de Pesquisa...",
                "title": "Filtros Ativos",
                "showMessage": "Mostrar todos",
                "collapseMessage": "Fechar todos"
            },
            "thousands": ".",
            "datetime": {
                "previous": "Anterior",
                "next": "Próximo",
                "hours": "Hora",
                "minutes": "Minuto",
                "seconds": "Segundo",
                "amPm": [
                    "am",
                    "pm"
                ],
                "unknown": "-",
                "months": {
                    "0": "Janeiro",
                    "1": "Fevereiro",
                    "10": "Novembro",
                    "11": "Dezembro",
                    "2": "Março",
                    "3": "Abril",
                    "4": "Maio",
                    "5": "Junho",
                    "6": "Julho",
                    "7": "Agosto",
                    "8": "Setembro",
                    "9": "Outubro"
                },
                "weekdays": [
                    "Dom",
                    "Seg",
                    "Ter",
                    "Qua",
                    "Qui",
                    "Sex",
                    "Sáb"
                ]
            },
            "editor": {
                "close": "Fechar",
                "create": {
                    "button": "Novo",
                    "submit": "Criar",
                    "title": "Criar novo registro"
                },
                "edit": {
                    "button": "Editar",
                    "submit": "Atualizar",
                    "title": "Editar registro"
                },
                "error": {
                    "system": "Ocorreu um erro no sistema (<a target=\"\\\" rel=\"nofollow\" href=\"\\\">Mais informações<\/a>)."
                },
                "multi": {
                    "noMulti": "Essa entrada pode ser editada individualmente, mas não como parte do grupo",
                    "restore": "Desfazer alterações",
                    "title": "Multiplos valores",
                    "info": "Os itens selecionados contém valores diferentes para esta entrada. Para editar e definir todos os itens para esta entrada com o mesmo valor, clique ou toque aqui, caso contrário, eles manterão seus valores individuais."
                },
                "remove": {
                    "button": "Remover",
                    "confirm": {
                        "_": "Tem certeza que quer deletar %d linhas?",
                        "1": "Tem certeza que quer deletar 1 linha?"
                    },
                    "submit": "Remover",
                    "title": "Remover registro"
                }
            },
            "decimal": ",",
            "stateRestore": {
                "creationModal": {
                    "button": "Criar",
                    "columns": {
                        "search": "Busca de colunas",
                        "visible": "Visibilidade da coluna"
                    },
                    "name": "Nome:",
                    "order": "Ordernar",
                    "paging": "Paginação",
                    "scroller": "Posição da barra de rolagem",
                    "search": "Busca",
                    "searchBuilder": "Mecanismo de busca",
                    "select": "Selecionar",
                    "title": "Criar novo estado",
                    "toggleLabel": "Inclui:"
                },
                "emptyStates": "Nenhum estado salvo",
                "removeConfirm": "Confirma remover %s?",
                "removeJoiner": "e",
                "removeSubmit": "Remover",
                "removeTitle": "Remover estado",
                "renameButton": "Renomear",
                "renameLabel": "Novo nome para %s:",
                "renameTitle": "Renomear estado",
                "duplicateError": "Já existe um estado com esse nome!",
                "emptyError": "Não pode ser vazio!",
                "removeError": "Falha ao remover estado!"
            },
            "infoEmpty": "Mostrando 0 até 0 de 0 registro(s)",
            "processing": "...",
            "searchPlaceholder": "Buscar registros"
        }
    };

    self.HideDataTableLoader = function () {
        $("#filtrosDatatableArea #loader").hide();
    };

    self.ShowDataTableLoader = function () {
        $("#filtrosDatatableArea #loader").show();
    };

    self.EnableDatatableFixedFooter = function () {
        var tableContainer = document.querySelector('#filtrosDatatableArea');
        var footer = document.querySelector('.totaisArea');

        tableContainer.addEventListener('scroll', function () {
            var maxScroll = tableContainer.scrollHeight - tableContainer.clientHeight;
            var limit = tableContainer.scrollTop + 1;

            if (limit >= maxScroll) {
                footer.classList.add('desafixarRodape');
                footer.classList.remove('fixarRodape');
            } else {
                footer.classList.add('fixarRodape');
                footer.classList.remove('desafixarRodape');
            }
        });
    };

    self.AddGroupByOption = function (elmt) {
        var shouldChangeReference = $(elmt).attr("onclick");
        if (shouldChangeReference) {
            elmt = elmt.parentElement.parentElement;
        }
        var propertyName = $(elmt).find('.modal-title-area > .propertyName').html();
        var propertyCategory = $(elmt).find('.modal-title-area > .propertyCategory').html();

        if (!propertyName)
            propertyName = $(elmt).parent().find('.modal-title-area > .propertyName').html();

        if (!propertyCategory)
            propertyCategory = $(elmt).parent().find('.modal-title-area > .propertyCategory').html();

        var html = `
                            <div class="groupByCard">
                                <span class="groupByCategory">${propertyCategory}</span>
                                <span class="groupByName">${propertyName}</span>
                <span class="groupByCloseIcon" onclick="return _mainModel.FecharGroupByOption(this)">&times;</span>
                            </div>
                        `;

        self.HideTickedBorder();
        $('.groupByArea .groupByCard').remove()
        $('.groupByArea').append(html);
        $('.iconMenuWithOptions').hide();
    };

    self.HideTickedBorder = function () {
        $('.tick-border-area').css('border-color', 'transparent');
    };

    self.ShowTickedBorder = function () {
        $('.tick-border-area').css('border-color', '#D6D6D6');
    };

    self.AddAttrOnClick = function (el) {
        var notExist = $(el).find('.iconMenuWithOptions').length == 0;
        if (notExist) {
            var newHtml = self.GetMenuHamburguerArea();
            $(el).find('.icon').html('');
            $(el).find('.modal-title-area').before(newHtml);
        }
    };

    self.RemoveAttrOnClick = function (el) {
        $(el).find(".iconMenuWithOptions").remove();
    };

    self.FecharGroupByOption = function (elmt) {
        $(elmt).parent().remove();
        self.ShowTickedBorder();
    };

    self.ExistInArray = function (propertyName, keywords) {
        return keywords.some(keyword => propertyName.includes(keyword));
    };

    self.GetUnidadeDeMedida = function (propertyName) {

        if (self.ExistInArray(propertyName, self._metroArray)) return 'm';
        if (self.ExistInArray(propertyName, self._metroQuadradoArray)) return 'm²';
        if (self.ExistInArray(propertyName, self._metroCubicoArray)) return 'm³';

        return '';
    };

    self.CookieUtil = {

        Set: function (name, value, days) {
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                var expires = "; expires=" + date.toGMTString();
            }
            else
                var expires = "";
            document.cookie = name + "=" + JSON.stringify(value) + expires + "; path=/";
        },

        Get: function (name) {
            var nameEQ = name + "=",
                ca = document.cookie.split(';');

            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0)
                    return JSON.parse(c.substring(nameEQ.length, c.length));
            }

            return null;
        },

        Delete: function (name, days) {
            self.CookieUtil.Set(name, '', -1)
        }

    };

    self.ShowXktLoaderForced = function () {
        $($('.sk-fading-circle')[0]).parent().css('visibility', 'visible');
    };

    self.HideXktLoaderForced = function () {
        $($('.sk-fading-circle')[0]).parent().css('visibility', 'hidden');
    };

    self.SelectElementOnXktById = function (elementId) {
        var viewer = self.CUSTOM_VIEWER;
        var scene = viewer.scene;

        viewer.scene.setObjectsSelected(viewer.scene.selectedObjectIds, false);
        scene.setObjectsSelected([elementId], true);

        var object = scene.objects[elementId];
        if (object) {
            viewer.cameraFlight.flyTo({
                aabb: object.aabb
            });
        } else {
            self.ShowWarningAlert("Elemento com ID " + elementId + " não encontrado.");
        }
    };

    self.HideDataTableVisaoCompartilhada = function () {
        $("#tabela_visao_compartilhada").DataTable().destroy();
        $("#datatableVisaoCompartilhadaArea #loaderVisaoCompartilhada").show();
        $("#datatableVisaoCompartilhadaArea").css("bottom", -1000);
        $("#datatableVisaoCompartilhadaArea").removeClass("minimized");
        $("#datatableVisaoCompartilhadaArea").css("top", "inherit");
    };

    self.ShowSuccessToastMessage = function (title, msg) {
        Swal.fire({
            toast: true,
            position: 'top-right',
            icon: 'success',
            title: title,
            html: msg,
            showConfirmButton: false,
            timer: 3000,
            background: '#d4edda',
            customClass: {
                popup: 'custom-toast-success'
            },
            showCloseButton: true
        });
    };

    self.ShowErrorToastMessage = function (title, msg) {
        Swal.fire({
            toast: true,
            position: 'top-right',
            icon: 'error',
            title: title,
            html: msg,
            showConfirmButton: false,
            timer: 5000,
            background: '#f8d7da',
            customClass: {
                popup: 'custom-toast-error'
            },
            showCloseButton: true
        });
    };

    self.ShowErrorToastMessageCustomTimer = function (title, msg, timer) {
        Swal.fire({
            toast: true,
            position: 'top-right',
            icon: 'error',
            title: title,
            html: msg,
            showConfirmButton: false,
            timer: timer,
            background: '#f8d7da',
            customClass: {
                popup: 'custom-toast-error'
            },
            showCloseButton: true
        });
    };

    self.ShowInfoToastMessage = function (title, msg) {
        Swal.fire({
            toast: true,
            position: 'top-right',
            icon: 'info',
            title: title,
            html: msg,
            showConfirmButton: false,
            timer: 5000,
            background: '#2B408E',
            customClass: {
                popup: 'custom-toast-info'
            },
            showCloseButton: true
        });
    };

    self.ShowConfirmationModal = function (title, description, okCallback, cancelCallback) {
        Swal.fire({
            title: title,
            text: description,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Federar',
            reverseButtons: true,
            customClass: {
                actions: 'swal2-actions-customizacao',
                confirmButton: 'btn-confirm-dialog', 
                cancelButton: 'btn-cancel-dialog', 
            }
        }).then((result) => {
            if (result.isConfirmed) {
                if (typeof okCallback === 'function') {
                    okCallback();
                }
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                if (typeof cancelCallback === 'function') {
                    cancelCallback();
                }
            }
        });
    };

    self.FormatTimeToHourMinute = function (timeString) {
        if (timeString && timeString.includes(":")) {
            return timeString.split(":").slice(0, 2).join(":");
        }
        return timeString;
    }

    self.CreateCommentAsync = function (event, idTarefa) {
        event.preventDefault();
        var target = event.target;
        var buttonElement = target;
        
        if (target.nodeName == 'svg') {
            buttonElement = $(buttonElement).parent();
        }

        if (target.nodeName == 'path') {
            buttonElement = $(buttonElement).parent().parent();
        }

        var cannotComment = $(buttonElement).hasClass('btn-disabled-comment');
        if (cannotComment) {
            return;
        }

        var idTarefaHtml = "#task_" + idTarefa;
        var comentarioCompleteString = $(`${idTarefaHtml} .input-comment`).val().trim();
        if (!comentarioCompleteString) {
            self.ShowErrorAlert("Por favor, insira um comentário antes de enviar.");
            return;
        }
        
        var inputFile = document.querySelector(`${idTarefaHtml} #image-attachment`);
        var files = inputFile.files;
        
        var formData = new FormData();
        formData.append("Id", 0);
        formData.append("IdObra", self.IdObra);
        formData.append("IdUsuario", self.IdUsuario);
        formData.append("IdTarefa", idTarefa);
        formData.append("IdTarefaPai", idTarefa);
        formData.append("IdStatus", 0);
        formData.append("Descricao", comentarioCompleteString);

        if (files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                formData.append(`Anexos[${i}]`, files[i]);
            }
        }

        // ADicionar icone loader
        var $submitButton = $(idTarefaHtml + " .footer-section.tarefa-footer-area .btn-send");
        $submitButton.prop("disabled", true);
        $submitButton.html('<i style="color: #fff;font-size: 14px;" class="fas fa-circle-notch fa-spin"></i>');

        var url = '/Tarefa/CreateCommentAsync?token=' + self.GetUrlToken();
        
        $.ajax({
            url: url,
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response.Success === false) {
                    self.ShowErrorAlert("Ocorreu um erro ao salvar o comentário. Tente novamente e se o erro continuar, por favor, reporte um issue");
                    return;
                }
                var idTarefa = response.Data.IdTarefaPai;
                var idTarefaHtml = `#task_${idTarefa}`;
                var idComentario = response.Data.Id;
                var canDeleteTaskComment = self._userActions.CanDeleteTasksComment;
                var canDeleteCommentAttr = (canDeleteTaskComment) ? "" : "btn-disabled-comment-attach custom-blocked-class";

                var excluirComentarioHtml = "";
                if (canDeleteTaskComment) {
                    excluirComentarioHtml = `
                    <div class="dropdown-menu no-select" id="commentDropdownMenu" data-id="${idComentario}" style="display: none; position: absolute; background: rgb(255, 255, 255); border: 1px solid rgb(221, 221, 221); padding: 10px; border-radius: 4px; font-size: 12px; top: -45px;">
                        <a class="dropdown-item" href="#" onclick="_mainModel.DeleteTaskComment(event, ${idComentario})" style="display: flex; justify-content: flex-start; align-items: center; padding: 0px; margin: 0px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.66634 2.33317L4.92722 1.81142C4.93769 1.79048 4.94874 1.76995 4.96034 1.74984C5.16775 1.39042 5.55223 1.1665 5.97071 1.1665H8.02864C8.44712 1.1665 8.83159 1.39042 9.03901 1.74984C9.05061 1.76995 9.06166 1.79048 9.07213 1.81142L9.33301 2.33317H11.083C11.4052 2.33317 11.6663 2.59434 11.6663 2.9165V3.49984H2.33301V2.9165C2.33301 2.59434 2.59418 2.33317 2.91634 2.33317H4.66634ZM4.08301 5.83317V11.6665H9.91634V5.83317H4.08301ZM2.91634 11.6665C2.91634 12.3108 3.43868 12.8332 4.08301 12.8332H9.91634C10.5607 12.8332 11.083 12.3108 11.083 11.6665V4.6665H2.91634V11.6665Z" fill="#D6D6D6"></path>
                            </svg>
                            <span>Excluir</span>
                        </a>
                    </div>
                `;
                } else {
                    excluirComentarioHtml = `
                    <div class="dropdown-menu no-select" id="commentDropdownMenu" data-id="${idComentario}" style="display: none; position: absolute; background: rgb(255, 255, 255); border: 1px solid rgb(221, 221, 221); padding: 10px; border-radius: 4px; font-size: 12px; top: -45px;">
                        <a class="dropdown-item ${canDeleteCommentAttr}" href="#" onclick="_mainModel.DeleteTaskComment(event, ${idComentario})" style="display: flex; justify-content: flex-start; align-items: center; padding: 0px; margin: 0px;" data-toggle="tooltip" data-placement="top" title="Seu perfil não tem permissão de excluir comentários">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.66634 2.33317L4.92722 1.81142C4.93769 1.79048 4.94874 1.76995 4.96034 1.74984C5.16775 1.39042 5.55223 1.1665 5.97071 1.1665H8.02864C8.44712 1.1665 8.83159 1.39042 9.03901 1.74984C9.05061 1.76995 9.06166 1.79048 9.07213 1.81142L9.33301 2.33317H11.083C11.4052 2.33317 11.6663 2.59434 11.6663 2.9165V3.49984H2.33301V2.9165C2.33301 2.59434 2.59418 2.33317 2.91634 2.33317H4.66634ZM4.08301 5.83317V11.6665H9.91634V5.83317H4.08301ZM2.91634 11.6665C2.91634 12.3108 3.43868 12.8332 4.08301 12.8332H9.91634C10.5607 12.8332 11.083 12.3108 11.083 11.6665V4.6665H2.91634V11.6665Z" fill="#D6D6D6"></path>
                            </svg>
                            <span>Excluir</span>
                        </a>
                    </div>
                `;
                }

                var newMessageHtml = `
                    <div id="comment_${idComentario}" class="my-chat-messages ">
                        <div class="chat-message-header">
                            <span class="chat-time">${self.FormatTimeToHourMinute(response.Data.Hora)}</span>
                        </div>
                        <div class="chat-content-with-exclusion-option">
                            <div class="menu-kbab-comments">
                                <div class="visualizacao-tarefa-header-button" onclick="_mainModel.ToogleMyCommentDropDownMenu(event, ${idComentario})">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00004 4.66666C7.07957 4.66666 6.33337 3.92047 6.33337 2.99999C6.33337 2.07952 7.07957 1.33333 8.00004 1.33333C8.92052 1.33333 9.66671 2.07952 9.66671 2.99999C9.66671 3.92047 8.92052 4.66666 8.00004 4.66666ZM8.00004 9.66666C7.07957 9.66666 6.33337 8.92047 6.33337 8C6.33337 7.07952 7.07957 6.33333 8.00004 6.33333C8.92052 6.33333 9.66671 7.07952 9.66671 8C9.66671 8.92047 8.92052 9.66666 8.00004 9.66666ZM6.33337 13C6.33337 13.9205 7.07957 14.6667 8.00004 14.6667C8.92052 14.6667 9.66671 13.9205 9.66671 13C9.66671 12.0795 8.92052 11.3333 8.00004 11.3333C7.07957 11.3333 6.33337 12.0795 6.33337 13Z" fill="#6F6F6F"></path>
                                    </svg>
                                </div>
                                ${excluirComentarioHtml}
                            </div>
                            <div class="chat-content">
                                <div class="chat-text">${response.Data.Descricao}</div>
                                <div class="chat-arrow">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                                        <path d="M0 0H11.1716C12.9534 0 13.8457 2.15428 12.5858 3.41421L0 16V0Z" fill="#E5E5E5"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        ${response.Data.Anexos && response.Data.Anexos.length > 0 ? `
                        <div class="chat-attachment">
                            ${response.Data.Anexos.map(a => `
                                <img src="${a.PathUrl}" alt="${a.FileName}" onerror="this.onerror=null; this.src='../assets/img/not-found-property-background.png'">
                            `).join('')}
                        </div>` : ''}
                    </div>
                `;
                
                // Remove a área "Digite o primeiro comentário..." se ela existir
                var $firstCommentArea = $(idTarefaHtml + " .enter-first-comment-area");
                if ($firstCommentArea.length > 0) {
                    $firstCommentArea.closest(".row").remove();
                }

                // Verifica se a estrutura de comentários já existe
                var $commentsArea = $(idTarefaHtml + " .all-task-comments-area");
                if ($commentsArea.length === 0) {
                    // Cria a estrutura completa de comentários se ela ainda não existir
                    var newCommentsAreaHtml = `
                    <div class="row no-padding">
                        <div class="all-task-comments-area">
                            <div class="chat-container">
                                ${newMessageHtml} 
                            </div>
                        </div>
                    </div>
                `;
                    $(idTarefaHtml + " .tarefa-comment-area").append(newCommentsAreaHtml);
                    self.ForceVerticalScroolInCommentArea(idTarefaHtml);
                } else {
                    // Caso a estrutura já exista, apenas adiciona o comentário
                    $(idTarefaHtml + " .chat-container").append(newMessageHtml);
                    self.ForceVerticalScroolInCommentArea(idTarefaHtml);
                }

                // Reseta os inputs e mensagens
                $(idTarefaHtml + ' #attachDropdownMenu').removeClass('.haveToShow');
                $(idTarefaHtml + ' #attachDropdownMenu').removeClass('.haveToHide');
                $(idTarefaHtml + " .input-comment").val("");
                inputFile.value = "";
                $(idTarefaHtml + ' .remove-attachment').click();
                self.ShowSuccessToastMessage("Comentário enviado com sucesso!", "Seu comentário foi adicionado.");
            },
            error: function () {
                self.ShowErrorAlert("Ocorreu um erro ao salvar o comentário. Tente novamente e se o erro continuar, por favor, reporte um issue");
            },
            complete: function () {
                $submitButton.prop("disabled", false);
                $submitButton.html(self.GetSendCommentIconHtml());
            }
        });
    };

    self.ForceVerticalScroolInCommentArea = function (idTarefaHtml) {
        var elementToScroll = $(idTarefaHtml + " .content-section.tarefa-comment-area");
        if (elementToScroll) {
            var mazSizeScroll = $(elementToScroll)[0].scrollHeight;
            $(elementToScroll).scrollTop(mazSizeScroll);
        }
    }

    self.GetSendCommentIconHtml = function () {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.76619 8.23383L8.35435 10.5865L10.707 5.29302L5.41354 7.64566L7.76619 8.23383ZM6.66669 9.33332L7.76523 13.7275C7.84212 14.035 8.26446 14.0717 8.39321 13.782L12.6294 4.2506C12.8773 3.69272 12.3073 3.12268 11.7494 3.37063L2.21803 7.6068C1.92833 7.73556 1.965 8.1579 2.27256 8.23479L6.66669 9.33332Z" fill="white"></path>
            </svg>
        `;
    };

    self.GetConfirmacaoExclusaoComentarioModalHtml = function (idComentario) {
        var title = "Excluindo comentário";
        var customArea = `Deseja excluir o comentário?`;
        var html = `
            <div id="meuModal" class="modal-confirmacao-exclusao-vista modal">
                <div class="modal-conteudo modal-conteudo-confirmacao-exclusao-vista">
                    <div class="modal-body">
                        <div class="modal-confirmacao-title-area">
                            <div class="confirmacao-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23Z" fill="#F45757"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11 14V6H13V14H11ZM11 18L11 16H13L13 18H11Z" fill="#F45757"/>
                                </svg>
                            </div>
                            <div class="confirmacao-title">
                                ${title}
                            </div>
                        </div>
                        <div class="confirmacao-descricao">
                            ${customArea}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancelarModalConfirmacaoExclusaoVista">Cancelar</button>
                        <button id="salvarVisaoCompartilhadaBtn" class="btn-confirma-exclusao-vista active text-sm" onclick="return _mainModel.ConfirmDeleteComentario(event, ${idComentario})">
                            Excluir
                        </button>
                    </div>
                </div>
            </div>

        `;

        return html;
    };

    self.ShowModalConfirmacaoExclusaoComentario = function (idComentario) {
        if (!idComentario) idComentario = 0;
        var html = self.GetConfirmacaoExclusaoComentarioModalHtml(idComentario);

        $("#modalConfirmacaoExclusaoVista").html("");
        $("#modalConfirmacaoExclusaoVista").append(html);
        $(".modal.modal-confirmacao-exclusao-vista").show();
        self.EnableEventsForConfirmacaoExclusaoModal();
    };

    self.DeleteTaskComment = function (event, idComentario) {
        event.preventDefault();
        var target = event.target
        var buttonElement = $(target);

        if (target.nodeName == 'svg' || target.nodeName == 'SPAN') {
            buttonElement = $(buttonElement).parent();
        }


        if (target.nodeName == 'path') {
            buttonElement = $(buttonElement).parent().parent();
        }

        var cannotComment = $(buttonElement).hasClass('custom-blocked-class');
        if (cannotComment) {
            return;
        }

        self.ShowModalConfirmacaoExclusaoComentario(idComentario);
    };

    self.ToogleMyCommentDropDownMenu = function (event, commentId) {
        event.preventDefault();
        const dropdown = document.querySelector(`#commentDropdownMenu[data-id="${commentId}"]`);
        if (!dropdown) {
            return;
        }

        const isVisible = dropdown.style.display === 'block';
        if (isVisible) {
            dropdown.style.display = 'none';
            return;
        }

        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });

        const rect = event.target.getBoundingClientRect();
        dropdown.style.display = 'block';

        // Close dropdown if clicked outside
        const closeDropdown = function (e) {
            if (!dropdown.contains(e.target) && !event.target.contains(e.target)) {
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeDropdown);
            }
        };

        document.addEventListener('click', closeDropdown);

        self.DisableBootstrapTooltipForClass('.btn-disabled-comment-attach.custom-blocked-class');
        self.EnableBootstrapTooltipForClass('.btn-disabled-comment-attach.custom-blocked-class');
    }

    self.ConfirmDeleteComentario = function (event, idComentario) {
        event.preventDefault();
        var btn = $(event.target);
        self.PostDeleteTaskComment(btn, idComentario);
    };

    self.PostDeleteTaskComment = async function (button, idComentario) {
        var postData = {
            idObra: self.IdObra,
            idComentario: idComentario
        }

        if (button) {
            button.html('<i style="color: #F45757;font-size: 14px;" class="fas fa-circle-notch fa-spin"></i>');
            button.prop("disabled", true);
            button.addClass("loading");
        }

        var url = '/Tarefa/DeleteCommentAsync?token=' + self.GetUrlToken();
        $.post(url, postData, function (response) {
            if (response.Success == false) {
                self.ShowErrorToastMessage('Erro ao deletar a comentário da tarefa!');
                return;
            }
            
            self.CloseModalConfirmacaoExclusaoTarefa();

            $(`#comment_${idComentario}`).remove();

            self.ShowSuccessToastMessage(`Comentário deletado com sucesso!`, `O comentário foi deletado com sucesso da tarefa.`);

        }).fail(function (jqXHR, textStatus, errorThrown) {
            self.ShowErrorAlert("Ocorreu um erro ao deletar o comentário. Por favor, tente novamente.");
        }).always(function () {
            if (button) {
                button.html('Excluir');
                button.prop("disabled", false);
                button.removeClass("loading");
            }
        });
    };

    self.HandleAtivarModuloTarefasNoModelo3d = function (element) {
        var $element = $(element);
        var hasToShowTasks = $element.hasClass('hasToShowTasks');

        if (hasToShowTasks) {

            self.ShowAllTasks();

            $element.removeClass('hasToShowTasks');
            $element.addClass('hasToHideTasks');


            self.DisableBootstrapTooltipForClass('#btnModuloTarefas');

            
            $element.attr("title", "Esconder tarefas Ctrl + E")
            self.EnableBootstrapTooltipForClass('#btnModuloTarefas');

            self.ToggleTasksFeedback(true);

        } else {
            self.HideAllTasks();
            $element.removeClass('hasToHideTasks');
            $element.addClass('hasToShowTasks');


            self.DisableBootstrapTooltipForClass('#btnModuloTarefas');
            $element.attr("title", "Exibir tarefas Ctrl + E")

            self.EnableBootstrapTooltipForClass('#btnModuloTarefas');

            self.ToggleTasksFeedback(false);
        }
    };

    self.ToggleTasksFeedback = function (showTasks) {
        const feedback = $("#feedback");

        if (showTasks) {
            feedback.text("Tarefas exibidas").fadeIn().delay(5000).fadeOut();
        } else {
            feedback.text("Tarefas escondidas").fadeIn().delay(5000).fadeOut();
        }
    };

    self.FindElementByText = function (selector, text) {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].textContent.includes(text)) {
                return elements[i];
            }
        }
        return null;
    };

    self.EnableCtrlEEvent = function () {
        document.addEventListener("keydown", function (event) {
            if (event.ctrlKey && event.key === "e") {
                event.preventDefault();

                $("#btnModuloTarefas").click();
            }
        });
    };

    self.CloseModalTarefasPro = function () {
        $('.tarefas-pro-modal').css('display', 'none');
    };

    self.ShowModalTarefasPro = function () {
        $('.tarefas-pro-modal').css('display', 'flex');
    };

    self.HandleModalSobre = function (element) {
        var html = self.GetModalSobreHtml();

        $("#modalSobre").html("");
        $("#modalSobre").append(html);
        $(".modal.modal-sobre").show();
        self.EnableEventsForModalSobre();
    };

    self.CloseModalSobre = function () {
        $(".modal.modal-sobre").hide();
    };

    self.EnableEventsForModalSobre = function () {
        document.querySelector('.fecharModalSobre').addEventListener('click', (event) => {
            self.CloseModalSobre();
        });
    };

    self.GetModalSobreHtml = function () {
        var title = "Sobre";

        var html = `
            <div id="meuModal" class="modal-sobre modal">
                <div class="modal-conteudo modal-conteudo-modal-sobre">
                    <div class="modal-header no-padding" style="padding-bottom: 16px !important;">
                        <span class="text">${title}</span>
                        <span class="fecharModalSobre">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99972 8.94283L11.2996 12.2427L12.2424 11.2999L8.94253 8.00003L12.2424 4.70019L11.2996 3.75739L7.99972 7.05722L4.69989 3.75739L3.75708 4.70019L7.05691 8.00003L3.75708 11.2999L4.69989 12.2427L7.99972 8.94283Z" fill="#6F6F6F"/>
                            </svg>
                        </span>
                    </div>
                    <div class="modal-body">
                        <div class="row" style="margin-top: 16px;">
                            <div class="col-sm-12 no-padding">
                                <p style="font-size: 0.8em;">
                                    Esta aplicação utiliza o <a href="https://xeokit.io/" target="_blank">xeokit</a> sob a licença AGPLv3.
                                    <br>
                                    O código-fonte da parte visual que interage com o xeokit está disponível <a href="https://github.com/Leandrocc2020/fastbim" target="_blank">aqui</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                    </div>
                </div>
            </div>

        `;

        return html;
    }

    self.GetAllTarefasAsyncResponseExample = function () {
        return {
            Data: [
                {
                    Id: 49011,
                    IdTarefaHTML: "task_49011",
                    IdObra: 1310,
                    IdDocumento: 99966,
                    Titulo: "TAREFA VERDE",
                    Descricao: "TAREFA VERDE",
                    Look: null,
                    CanvasPos: { X: 0, Y: 0, Z: 0 },
                    ViewPos: { X: 0, Y: 0, Z: 0 },
                    WorldPos: {
                        X: 3.1308030416393358,
                        Y: 5.149740085322712,
                        Z: 17.821049910685193
                    },
                    MarkerCustomColorByPlantaStatus: "#1B893A",
                    IsPrivada: false
                },
                // {
                //     Id: 49012,
                //     IdTarefaHTML: "task_49012",
                //     IdObra: 1310,
                //     IdDocumento: 1163486,
                //     Titulo: "TAREFA VERMELHA",
                //     Descricao: "TAREFA VERMELHA",
                //     Look: null,
                //     CanvasPos: { X: 0, Y: 0, Z: 0 },
                //     ViewPos: { X: 0, Y: 0, Z: 0 },
                //     WorldPos: {
                //         X: 16.075284085298144,
                //         Y: 10.38415788204162,
                //         Z: -24.2956499602695
                //     },
                //     MarkerCustomColorByPlantaStatus: "#E25A61",
                //     IsPrivada: false
                // }
            ],
            Result: null,
            Success: true,
            Message: null,
            Exception: null,
            HttpStatusCode: 0,
            Code: 0
        };
    };

    self.GetPersistTarefaModalHtmlResponseExample = function () {
        return {
            Data: ``
        };
    };
}