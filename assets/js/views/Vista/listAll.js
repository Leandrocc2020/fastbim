function ListAllModel() {

    // --------------------------------
    //  Variables and constants
    // --------------------------------
    let self = this;

    self.IsSearching = false;
    self.SearchValues = [];

    // --------------------------------
    //  Methods
    // --------------------------------
  

    
    
    self.DisableSearchEvents = function () {
        $('.enableSearch').each(function () {
            var element = this;
            $(element).unbind();
        });
    };

    self.IsNullOrEmpty = function (value) {

        if (value != null && value != undefined) {

            if ($.type(value) === "string")
                return (!value || 0 === value.length);

            return false;
        }

        return true;
    };

    self.DatatableServerSideRefresh = function (datatable) {
        if (!self.IsNullOrEmpty(datatable)) {
            datatable.ajax.reload();
        }
    };

    self.EnableSearchEvents = function () {

        self.DisableSearchEvents();

        // Desabilita ordenação ao clicar no input
        $('#tabela_visao_compartilhada thead input').on('click', function (e) {
            e.stopPropagation();
        });

        $('.enableSearch').on('keyup change', function (ev) {
            ev.stopPropagation();
            
            setTimeout(function () {
                if (!self.IsSearching) {
                    var table = $('#tabela_visao_compartilhada').DataTable();
                    self.DatatableServerSideRefresh(table);
                    self.IsSearching = true;
                }
            }, 2500);

            self.IsSearching = false;
            
        });
    };

    self.AppendFooterFiltersIntoThead = function () {
        $("div#datatableVisaoCompartilhadaArea div#datatableVisaoCompartilhada div#tabela_visao_compartilhada_wrapper table#tabela_visao_compartilhada tfoot tr").appendTo("div#datatableVisaoCompartilhadaArea div#datatableVisaoCompartilhada div#tabela_visao_compartilhada_wrapper table#tabela_visao_compartilhada thead");
        $("div#datatableVisaoCompartilhadaArea div#datatableVisaoCompartilhada div#tabela_visao_compartilhada_wrapper table#tabela_visao_compartilhada thead > tr:first-child").remove();
    };

    self.TransformCreatedColumnsIntoInputs = function () {
        $("div#datatableVisaoCompartilhadaArea div#datatableVisaoCompartilhada div#tabela_visao_compartilhada_wrapper table#tabela_visao_compartilhada tfoot th").each(function (idx, elmt) {
            $(this).html('<input class="form-control form-control-sm enableSearch" id="' + "searchObjectName" + '" type="text" placeholder="' + "Nome do objeto" + '" autocomplete="off" />');
        });
    };

    self.RemoveFilters = function () {
        $('div#datatableVisaoCompartilhadaArea div#datatableVisaoCompartilhada div#tabela_visao_compartilhada_wrapper div.dataTables_filter').remove();
    };

    self.CreateFiltersForDatatableColumns = function () {
        $("div#datatableVisaoCompartilhadaArea div#datatableVisaoCompartilhada div#tabela_visao_compartilhada_wrapper table#tabela_visao_compartilhada thead tr")
            .clone(true)
            .addClass('dataTables')
            .appendTo("div#datatableVisaoCompartilhadaArea div#datatableVisaoCompartilhada div#tabela_visao_compartilhada_wrapper table#tabela_visao_compartilhada tfoot");
    };

    self.EnableResizeOnDatatable = function () {
        $("#datatableVisaoCompartilhadaArea").resizable({
            handles: 'n', // 'n' permite o redimensionamento apenas na parte superior (norte),
            maxHeight: _mainModel.CalculateMaxHeight(90), // 90% da altura da janela do navegador
            minHeight: 125, // em pixels
            start: function (event, ui) {
                $(this).css('transition', 'none');
            },
            stop: function (event, ui) {
                $(this).css('transition', '300ms ease-in-out');
            }
        });
    };

    self.PosRendererActions = function (vistaName) {
        var searchValue = $(".enableSearch").val();

        self.RemoveFilters();
        self.CreateFiltersForDatatableColumns();
        self.TransformCreatedColumnsIntoInputs();
        self.AppendFooterFiltersIntoThead();
        self.EnableSearchEvents();
        
        $("#datatableVisaoCompartilhada #dttable-description span strong").text(vistaName);
        if (searchValue) {
            $(".enableSearch").val(searchValue);
            $(".enableSearch").focus();
        }

        self.EnableResizeOnDatatable();

        $("#datatableVisaoCompartilhadaArea #loaderVisaoCompartilhada").hide();

        _mainModel.EnableBootstrapTooltipForClass('.goToModel');
    };

    self.ShowDatatableVisaoCompartilhada = function (idVista, vistaName) {

        _mainModel.HideDataTableVisaoCompartilhada();

        $("#datatableVisaoCompartilhadaArea").show();
        $("#datatableVisaoCompartilhadaArea").css("bottom", 0);
        $("#datatableVisaoCompartilhadaArea #loaderVisaoCompartilhada").show();

        setTimeout(function () {
            var drawCallback = function (settings) {
                var api = this.api();

                setTimeout(function () {
                    api.columns.adjust();
                }, 300);

                self.PosRendererActions(vistaName);
            };

            $('#tabela_visao_compartilhada').DataTable({
                "language": _mainModel.GetDatatableLanguageOptions(),
                "processing": true,
                "serverSide": true,
                "lengthMenu": [[10, 50, 100, 1000, 5000], ["10 linhas", "50 linhas", "100 linhas", "1000 linhas", "5000 linhas"]],
                "ajax": {
                    "url": "/Vista/LoadTable",
                    "type": "POST",
                    "data": function (d) {
                        var customFilters = {
                            idObra: _mainModel.IdObra,
                            idUsuario: _mainModel.IdUsuario,
                            idVista: idVista
                        };

                        d.search = {
                            regex: false,
                            value: $(".enableSearch").val()
                        };

                        var filterObject = Object.assign({}, d, customFilters);
                        return JSON.stringify(filterObject);
                    }
                },
                "columns": [
                    { 'data': 'ElementName', 'visible': true, 'searchable': true, 'orderable': true },
                ],
                "drawCallback": drawCallback,
                "createdRow": function (row, data, dataIndex) {
                    var onclickElement = `
                        return _mainModel.SelectElementOnXktById('${data.ElementId}')
                    `;
                    var customRowHtml = `
                        <span onclick="${onclickElement}" class="goToModel" title="Encontrar no modelo 3D" data-bs-placement="bottom" data-bs-toggle="tooltip">
                            ${ $(row).find('td').text() }
                        </span>
                    `;

                    $(row).attr('id', 'row-' + data.ElementId);
                    $(row).find('td').html('');
                    $(row).find('td').html(customRowHtml);
                },
            });
        }, 500);
    };

    self.ConfirmDeleteVista = function (idVista, event) {
        if (!idVista || idVista == 0) _mainModel.ShowWarningAlert("A visão compartilhada precisa ser informada.");

        var $button = $(event.target);
        $button.html('<i style="margin-right: 4px;" class="fas fa-circle-notch fa-spin"></i> Excluir');
        $button.prop("disabled", true);
        $button.addClass("loading");

        var postData = {
            idObra: _mainModel.IdObra,
            idUsuario: _mainModel.IdUsuario,
            idVista: idVista
        };

        setTimeout(function () {
            $.post(`/Vista/Delete`, postData, function (response) {
                if (!response.Success) {
                    console.log(response.Message)
                    _mainModel.ShowErrorToastMessage("Erro ao excluir a visão compartilhada!", "Tente novamente e se o erro continuar, por favor, chame nosso suporte.");
                    return;
                }

                self.CloseModalConfirmacaoExclusaoVista();
                _mainModel.RefreshVisaoCompartilhadaArea();
                _mainModel.ShowSuccessToastMessage("Visão compartilhada excluída!", "");
                

            }).fail(function (jqXHR, textStatus, errorThrown) {

                console.log(`Erro na requisição: (${jqXHR.status}) - ${textStatus}`, errorThrown);
                _mainModel.ShowErrorToastMessage("Erro ao excluir a visão compartilhada!", "Tente novamente e se o erro continuar, por favor, chame nosso suporte.");

            }).always(function () {
                $button.text("Excluir");
                $button.prop("disabled", false);
                $button.removeClass("loading");
            })
        }, 100);

    };

    self.GetConfirmacaoExclusaoModalHtml = function (idVista, vistaNome) {
        var title = "Excluindo visão compartilhada";
        var customArea = `Tem certeza que deseja excluir <strong>${vistaNome}</strong> ?`;
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
                        <button id="salvarVisaoCompartilhadaBtn" class="btn-confirma-exclusao-vista active text-sm" onclick="return _listAllModel.ConfirmDeleteVista(${idVista}, event)">
                            Excluir
                        </button>
                    </div>
                </div>
            </div>

        `;
        return html;
    };

    self.ShowModalConfirmacaoExclusao = function (idVista, vistaNome) {
        if (!idVista) idVista = 0;
        if (!vistaNome) vistaNome = "";
        
        var html = self.GetConfirmacaoExclusaoModalHtml(idVista, vistaNome);

        $("#modalConfirmacaoExclusaoVista").html("");
        $("#modalConfirmacaoExclusaoVista").append(html);
        $(".modal.modal-confirmacao-exclusao-vista").show();
        self.EnableEventsForConfirmacaoExclusaoModal();
    };

    self.EnableEventsForConfirmacaoExclusaoModal = function () {
        document.querySelector('#cancelarModalConfirmacaoExclusaoVista').addEventListener('click', (event) => {
            self.CloseModalConfirmacaoExclusaoVista();
        });
    };

    self.CloseModalConfirmacaoExclusaoVista = function () {
        $(".modal.modal-confirmacao-exclusao-vista").hide();
    };

    self.GetModalCopiarLinkHtml = function (link, idVista) {
        var html = `
            <div id="meuModal" class="modal-copiar-visao-compartilhada modal">
                <div class="modal-conteudo modal-conteudo-copiar-visao-compartilhada">
                    <div class="modal-header no-padding" style="padding-bottom: 16px !important;">
                        <span class="text">Copiar link</span>
                        <span class="fecharModalCopiarVisaoCompartilhada">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99972 8.94283L11.2996 12.2427L12.2424 11.2999L8.94253 8.00003L12.2424 4.70019L11.2996 3.75739L7.99972 7.05722L4.69989 3.75739L3.75708 4.70019L7.05691 8.00003L3.75708 11.2999L4.69989 12.2427L7.99972 8.94283Z" fill="#6F6F6F"/>
                            </svg>
                        </span>
                    </div>
                    <div class="modal-body">
                        <div class="row" style="margin-top: 20px;">
                            <div class="col-sm-11 no-padding">
                                <div class="form-group position-relative">
                                    <label for="linkVisaoCompartilhada" class="select-label">Link</label>
                                    <input id="linkVisaoCompartilhada" type="text" class="form-control defaultModalText" autocomplete="off" value="${link}">
                                </div>
                            </div>
                            <div class="col-sm-1 no-padding">
                                <span class="copiarLinkBtn" onclick="return _mainModel.CopyLinkToTransferArea()">${_mainModel.GetCopiarLinkIcon()}</span>
                            </div>
                        </div>
                        <div class="row" style="margin-top: 16px;">
                            <div class="linkModalAlert">
                                <span class="iconAlertArea">
                                    ${_mainModel.GetExclamationIconForLinkModal()}
                                </span>
                                <span class="textAlertArea">
                                    Apenas pessoas adicionadas no empreendimento e que tenham perfil com permissão para ver documentos conseguirão acessar o link
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="salvarLinkVisaoCompartilhadaBtn" class="btn-salvar-configuracoes active text-sm">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>

        `;
        return html;
    };

    self.ShowModalCopiarLink = function (link, idVista) {
        if (!idVista) idVista = 0;
        if (!link) link = "";

        var html = self.GetModalCopiarLinkHtml(link, idVista);

        $("#modalCopiarVisaoCompartilhada").html("");
        $("#modalCopiarVisaoCompartilhada").append(html);
        $(".modal.modal-copiar-visao-compartilhada").show();

        self.EnableEventsForCopiarLinkModal();
    };

    self.EnableEventsForCopiarLinkModal = function () {
        document.querySelector('.fecharModalCopiarVisaoCompartilhada').addEventListener('click', (event) => {
            self.CloseCopiarVisaoCompartilhadaModal();
        });

        document.querySelector('#salvarLinkVisaoCompartilhadaBtn').addEventListener('click', (event) => {
            self.CloseCopiarVisaoCompartilhadaModal();
        });

        _mainModel.EnableCopyElementTextToTransferenceArea("#linkVisaoCompartilhada", "Texto copiado!");
        
        setTimeout(function () {
            $('.copiarLinkBtn').click();
        }, 300)
    };

    self.CloseCopiarVisaoCompartilhadaModal = function () {
        $(".modal.modal-copiar-visao-compartilhada").hide();
    };

}