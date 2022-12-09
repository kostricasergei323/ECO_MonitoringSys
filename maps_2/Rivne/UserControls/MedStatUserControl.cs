using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using UserMap.Helpers;

namespace UserMap.UserControls
{
    public partial class MedStatUserControl : UserControl
    {
        private int regionId;
        private int findObjectId;
        private int timerDelay;

        private Data.DBManager dbManager;

        private System.Threading.Timer refreshTimer;

        private Services.ILogger logger;

#if DEBUG
        private Size oldSize;
        private ScrollBar horizontalMedStatScroll;
#endif // DEBUG


        public MedStatUserControl() : this(-1)
        { }
        public MedStatUserControl(int objId)
        {
            InitializeComponent();
            InitializeDBManager();

            FindObjectId = objId;

            refreshTimer = new System.Threading.Timer(RefreshButtonClickTimeOut, null, System.Threading.Timeout.Infinite, System.Threading.Timeout.Infinite);

            timerDelay = -1;

            logger = new Services.FileLogger();
#if DEBUG
            horizontalMedStatScroll = MedStatDataGridView.Controls.OfType<ScrollBar>().First();
            oldSize = this.Size;
#endif //DEBUG
        }

        /// <summary>
        /// Представляет ИД объекта, по котором будет выводиться мед статистика.
        /// </summary>
        public int FindObjectId
        {
            get => findObjectId;
            set
            {
                findObjectId = value;
                SetRegionId();
            }
        }

        private void InitializeDBManager()
        {
            try
            {
                dbManager = new Data.DBManager();
            }
            catch { }
        }

        private void CheckedInnerMostTreeNodesAction(TreeView treeView, Action<TreeNode> action)
        {
            foreach (TreeNode node in treeView.Nodes)
            {
                if (node.Checked)
                {
                    TreeNodes(node);
                }
            }

            //Локальная функция для поиска вложенных ветвей
            void TreeNodes(TreeNode treeNode)
            {
                if (treeNode.Nodes.Count != 0)
                {
                    foreach (TreeNode innerNode in treeNode.Nodes)
                    {
                        if (innerNode.Checked)
                        {
                            TreeNodes(innerNode);
                        }
                    }
                }
                else
                {
                    action(treeNode);
                }
            }
        }

        /// <summary>
        /// Загрузка мед. статистики в зависимости от выбранных фильтров.
        /// </summary>
        private Task LoadFilteredMedStat()
        {
            string tables = "med_stat, med_stat_param_1, formulas, issues";
            string columns = "formulas.name_of_formula, formulas.description_of_formula, formulas.measurement_of_formula," +
                             "med_stat.value, med_stat.year, issues.name, med_stat.nomer, med_stat_param_1.value";
            string joinCond = "med_stat.nomer = med_stat_param_1.number_of_formula, " +
                              "med_stat.id_of_formula = formulas.id_of_formula, " +
                              "med_stat.issue_id = issues.issue_id";
            StringBuilder cond = new StringBuilder("med_stat.region_id = " + regionId.ToString());

            int lastPointedYear = -1;

            var checkedYearNodes = MedStatYearsTreeView.Nodes.OfType<TreeNode>()
                                                             .Where(treeNode => treeNode.Checked);
            if (checkedYearNodes.Any())
            {
                cond.Append(" AND (");
                foreach (TreeNode node in checkedYearNodes)
                {
                    if (int.TryParse(node.Text, out int year))
                    {
                        if (lastPointedYear < year)
                        {
                            lastPointedYear = year;
                        }

                        cond.Append("med_stat.year = ");
                        cond.Append(node.Text);
                    }
                    else
                    {
                        if (lastPointedYear == -1)
                        {
                            lastPointedYear = DateTime.Now.Year - 1;
                        }

                        cond.Append(" (med_stat.year > ");
                        cond.Append(lastPointedYear);
                        cond.Append(" AND med_stat.year <= ");
                        cond.Append(DateTime.Now.Year);
                        cond.Append(')');
                    }

                    cond.Append(" OR ");
                }
                cond.Remove(cond.Length - 3, 3).Append(')');
            }

            cond.Append(" AND (");
            CheckedInnerMostTreeNodesAction(MedStatIndicatorsTreeView, node => cond.Append("med_stat_param_1.value = ").Append(Data.DBUtil.AddQuotes(node.Text)).Append(" OR "));

            var isSNC = ConditionAmount(MedStatIndicatorsTreeView);

            if (cond[cond.Length - 1] != '(')
            {
                cond.Remove(cond.Length - 3, 3);
                cond.Append(')');
            }
            else
            {
                cond.Remove(cond.Length - 5, 5);
            }

            return dbManager.GetRowsUsingJoinAsync(tables, columns, joinCond, cond.ToString(), Data.JoinType.LEFT)
                            .ContinueWith(result =>
                            {
                                return result.Result.Select(row =>
                                {
                                    return new
                                    {
                                        Id = (int)row[6],
                                        IssueName = row[5].ToString(),
                                        FormulaName = row[0].ToString(),
                                        FormulaDescription = row[1].ToString(),
                                        Value = row[3].ToString(),
                                        FormulaMeasurment = row[2].ToString(),
                                        Year = row[4].ToString(),
                                        ParamValue = row[7].ToString()
                                    };
                                });
                            })
                            .ContinueWith(result =>
                            {
                                return result.Result.GroupBy(key => key.Id)
                                                    .Where(item => isSNC == item.Count())
                                                    .Select(item => item.First())
                                                    .ToList();
                            })
                            .ContinueWith(result =>
                            {
                                var res = result.Result;

                                if (res == null || !res.Any())
                                {
                                    return;
                                }

                                string[] columnsName = { "Назва задачі", "Показник", "Рік розрахунку" };
                                int index = 0;

                                MedStatDataGridView.DataSource = res;

                                MedStatDataGridView.Columns[3].Visible = false;
                                MedStatDataGridView.Columns[0].Visible = false;
                                MedStatDataGridView.Columns[4].Visible = false;
                                MedStatDataGridView.Columns[5].Visible = false;
                                MedStatDataGridView.Columns[7].Visible = false;

                                foreach (DataGridViewColumn column in MedStatDataGridView.Columns)
                                {
                                    var columnHeader = column.HeaderCell.Value.ToString();

                                    if (columnHeader != "Id" && columnHeader != "FormulaDescription" &&
                                        columnHeader != "Value" && columnHeader != "FormulaMeasurment" &&
                                        columnHeader != "ParamValue")
                                    {
                                        column.HeaderCell.Value = columnsName[index++];
                                    }
                                }

                            }, TaskScheduler.FromCurrentSynchronizationContext())
                            .CatchAndLog(logger);
        }
        private Task SetRegionId()
        {
            return dbManager.GetValueAsync("region", "id", "id_of_poligon = " + FindObjectId.ToString())
                            .ContinueWith(result =>
                            {
                                var resultId = result.Result;
                                if (resultId == null || resultId is DBNull)
                                    regionId = -1;
                                else
                                    regionId = (int)resultId;
                            })
                            .CatchAndLog(logger);
        }
        private Task LoadFiltrationYear()
        {
            return dbManager.GetRowsAsync("med_stat", "DISTINCT year", "")
                            .ContinueWith(result =>
                            {
                                return result.Result.Select(row => new TreeNode(row[0].ToString()))
                                                    .ToArray();
                            })
                            .ContinueWith(result =>
                            {
                                MedStatYearsTreeView.Nodes.AddRange(result.Result);
                            }, TaskScheduler.FromCurrentSynchronizationContext())
                            .CatchAndLog(logger);
        }
        private async Task LoadFiltrationIndicators()
        {
            string medStatTables = "med_stat, med_stat_param_1";
            string medStatColumns = "DISTINCT med_stat_param_1.id_of_param, med_stat.id_of_formula," +
                                    "med_stat_param_1.value";
            string medStatJoinCond = "med_stat.nomer = med_stat_param_1.number_of_formula";
            string medStatCond = "med_stat.region_id = " + regionId.ToString();

            var medStatResult = await dbManager.GetRowsUsingJoinAsync(medStatTables, medStatColumns, medStatJoinCond,
                                                                      medStatCond, Data.JoinType.INNER)
                                               //Получаем сгруппированные параметры для мед. статистики в зависимости от формулы
                                               .ContinueWith(result =>  
                                               {
                                                   //Группировка по формулам (med_stat.id_of_formula)
                                                   return result.Result.GroupBy(key => (int)key[1], value => new
                                                   {
                                                       Id = (int)value[0],
                                                       Value = value[2].ToString()
                                                   })
                                                   .ToDictionary(key => key.Key, value =>
                                                   {
                                                       //Группируем и сортируем уже по med_stat_param_1.id_of_param, 
                                                       // ибо на один id_of_param может быть несколько значений
                                                       var innerResult = value.GroupBy(innerKey => innerKey.Id,
                                                                                       innerValue => innerValue.Value)
                                                                              .OrderBy(item => item.Key)
                                                                              .ToDictionary(innerKey => innerKey.Key,
                                                                                            innerValue => innerValue.ToList());

                                                       return innerResult;
                                                   });
                                               })
                                               .CatchAndLog(logger);

            if (medStatResult == default)
            {
                return;
            }

            StringBuilder formulasCond = new StringBuilder();

            foreach (var item in medStatResult)
            {
                formulasCond.Append("id_of_formula = ");
                formulasCond.Append(item.Key);
                formulasCond.Append(" OR ");

                foreach (var innerItem in item.Value)
                {
                    formulasCond.Append("id_of_formula = ");
                    formulasCond.Append(innerItem.Key);
                    formulasCond.Append(" OR ");
                }
            }

            if (formulasCond.Length > 3)
                formulasCond.Remove(formulasCond.Length - 3, 3);

            await dbManager.GetRowsAsync("formulas", "DISTINCT id_of_formula, name_of_formula, " +
                                         "measurement_of_formula", formulasCond.ToString())
                            //Т.к.  med_stat_param_1.id_of_param и med_stat.id_of_formula по сути представляют одно и тоже,
                            //то делаем соединения medStatResult с результирующим набором для сопоставления с 
                            //id_of_formula у формулы.
                            .ContinueWith(result =>
                            {
                                var typedResult = result.Result.Select(row => new
                                {
                                    Id = (int)row[0],
                                    Name = row[1].ToString(),
                                    Measurment = row[2].ToString(),
                                    Values = (List<string>)null
                                });

                                //Здесь outer.Id - formulas.id_of_formula, а inner.Key - med_stat.id_of_formula 
                                var res = typedResult.Join(medStatResult, outer => outer.Id, inner => inner.Key,
                                                      (row, inner) =>
                                                      {
                                                          //Здесь outer.Key - med_stat_param_1.id_of_param, а _inner.Id - formulas.id_of_formula 
                                                          var paramNames = inner.Value.Join(typedResult, outer => outer.Key,
                                                                                            _inner => _inner.Id, (param, tResult) =>
                                                                                            {
                                                                                                return new
                                                                                                {
                                                                                                    Name = tResult.Name,
                                                                                                    Measurment = tResult.Measurment,
                                                                                                    Values = param.Value
                                                                                                };
                                                                                            });

                                                          return new
                                                          {
                                                              FormulaName = row.Name,
                                                              FormulaMeasurment = row.Measurment,
                                                              Parameters = paramNames
                                                          };
                                                      });

                                return res;
                            })
                            .ContinueWith(result =>
                            {
                                var nodes = new List<TreeNode>();

                                foreach (var formula in result.Result)
                                {
                                    var paramNode = new TreeNode($"{formula.FormulaName} ({formula.FormulaMeasurment})");
                                    foreach (var parameter in formula.Parameters)
                                    {
                                        var parameterNode = new TreeNode($"{parameter.Name} ({parameter.Measurment})");
                                        foreach (var value in parameter.Values)
                                        {
                                            parameterNode.Nodes.Add(value);
                                        }
                                        paramNode.Nodes.Add(parameterNode);
                                    }

                                    nodes.Add(paramNode);
                                }

                                MedStatIndicatorsTreeView.Nodes.AddRange(nodes.ToArray());
                            }, TaskScheduler.FromCurrentSynchronizationContext())
                            .CatchAndLog(logger)
                            .ConfigureAwait(false);
        }

        private int GetTimerDelay()
        {
            var dbCallDelayStr = System.Configuration.ConfigurationManager.AppSettings.Get("DBCallDelay");
            int dbCallDelay = 0;

            if (!int.TryParse(dbCallDelayStr, out dbCallDelay))
            {
                dbCallDelay = 5000;
            }

            return dbCallDelay;
        }
        private int ConditionAmount(TreeView treeView)
        {
            int index = 0;

            foreach (TreeNode node in treeView.Nodes)
            {
                if (node.Nodes.Count != 0)
                {
                    var checkedNodes = CheckedNodes(node);

                    if (checkedNodes != 0)
                    {
                        return checkedNodes;
                    }
                }
                else if (node.Checked)
                {
                    index++;
                }
            }

            int CheckedNodes(TreeNode node)
            {
                int innderIndex = 0;

                if (!node.Checked)
                {
                    return innderIndex;
                }

                foreach (TreeNode _node in node.Nodes)
                {
                    if (_node.Nodes.Count != 0 && _node.Nodes[0].Nodes.Count != 0)
                    {
                        var checkedNodes = CheckedNodes(_node);

                        if (checkedNodes != 0)
                        {
                            return checkedNodes;
                        }
                    }
                    else if (_node.Checked)
                    {
                        innderIndex++;
                    }
                }

                return innderIndex;
            }

            return index;
        }

        private async void MedStatUserControl_Load(object sender, EventArgs e)
        {
            await SetRegionId();
            await LoadFiltrationYear();
            await LoadFiltrationIndicators();

            MedStatYearsTreeView.Nodes.Add("Поточний рік");
        }
        private void MedStatUserControlTabControl_Resize(object sender, EventArgs e)
        {
            //Кому не лень - попробуйте приделать расширение гридов в зависимости от их переполнения
            //bool isBackward = false;
            //if (oldSize.Width > Width)
            //{
            //    isBackward = true;
            //}

            //if (!isBackward && MedStatDataGridView.Rows.Count > 0 && !horizontalMedStatScroll.Visible)
            //{
            //    MedStatParamDataGridView.Anchor = AnchorStyles.Left | AnchorStyles.Top |
            //                                      AnchorStyles.Bottom | AnchorStyles.Right;
            //    MedStatDataGridView.Anchor = AnchorStyles.Left | AnchorStyles.Top | AnchorStyles.Bottom;
            //    MedStatParamLable.Anchor = MedStatDataGridView.Anchor;
            //}
            //else if (isBackward && MedStatParamDataGridView.Size.Width == MedStatParamDataGridView.MinimumSize.Width)
            //{
            //    MedStatParamDataGridView.Anchor = AnchorStyles.Right | AnchorStyles.Top |
            //                                      AnchorStyles.Bottom;
            //    MedStatDataGridView.Anchor = AnchorStyles.Left | AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Right;

            //    var medStatDGVRight = MedStatDataGridView.Location.X + MedStatDataGridView.Width;

            //    MedStatParamDataGridView.Location = new Point(medStatDGVRight + 10, MedStatDataGridView.Location.Y);
            //}
            //else if (MedStatParamDataGridView.Size.Width == MedStatParamDataGridView.MinimumSize.Width)
            //{
            //    MedStatParamDataGridView.Anchor = AnchorStyles.Right | AnchorStyles.Top | AnchorStyles.Bottom;
            //    MedStatDataGridView.Anchor = AnchorStyles.Left | AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Right;
            //    MedStatParamLable.Anchor = MedStatParamDataGridView.Anchor;
            //}

            //oldSize = Size;
        }

        private void MedStatDataGridView_CellFormatting(object sender, DataGridViewCellFormattingEventArgs e)
        {
            var dataGridView = sender as DataGridView;

            if (e.Value == null || e.ColumnIndex == -1 || e.RowIndex == -1)
            {
                return;
            }

            var currentRow = dataGridView.Rows[e.RowIndex];

            switch (dataGridView.Tag.ToString())
            {
                case "1":
                    currentRow.Cells[e.ColumnIndex].ToolTipText = currentRow.Cells[3].Value.ToString();
                    //e.Value = e.Value + " на (" + currentRow.Cells[7].Value.ToString() + ")";
                    break;
                case "2":
                    currentRow.Cells[e.ColumnIndex].ToolTipText = currentRow.Cells[1].Value.ToString();
                    break;
                default:
                    break;
            }
        }

        private async void MedStatDataGridView_SelectionChanged(object sender, EventArgs e)
        {
            if (MedStatDataGridView.SelectedRows.Count == 0)
            {
                return;
            }

            string tables = "med_stat_param_1, formulas";
            string columns = "formulas.name_of_formula, formulas.description_of_formula, " +
                             "formulas.measurement_of_formula, med_stat_param_1.value";
            string joinCond = "med_stat_param_1.id_of_param = formulas.id_of_formula";
            string cond = "med_stat_param_1.number_of_formula = " + MedStatDataGridView.SelectedRows[0].Cells[0].Value;

            await dbManager.GetRowsUsingJoinAsync(tables, columns, joinCond, cond, Data.JoinType.INNER)
                           .ContinueWith(result =>
                           {
                               var _result = result.Result;

                               return _result.Select(row =>
                               {
                                   return new
                                   {
                                       FormulaName = row[0].ToString(),
                                       FormulaDescription = row[1].ToString(),
                                       Value = row[3].ToString(),
                                       Measurement = row[2].ToString()
                                   };
                               }).ToList();
                           })
                           .ContinueWith(result =>
                           {
                               var res = result.Result;
                               var selectedMedStatRow = MedStatDataGridView.SelectedRows[0];

                               res.Add(new
                               {
                                   FormulaName = "Значення",
                                   FormulaDescription = selectedMedStatRow.Cells[3].Value.ToString(),
                                   Value = selectedMedStatRow.Cells[4].Value.ToString(),
                                   Measurement = selectedMedStatRow.Cells[5].Value.ToString()
                               });

                               MedStatParamDataGridView.DataSource = res;

                               string[] columnsName = { "Назва параметру", "Опис", "Значення", "Одиниці виміру" };
                               int index = 0;

                               MedStatParamDataGridView.Columns[1].Visible = false;

                               foreach (DataGridViewColumn column in MedStatParamDataGridView.Columns)
                               {
                                   column.HeaderCell.Value = columnsName[index++];
                               }
                           }, TaskScheduler.FromCurrentSynchronizationContext())
                           .CatchAndLog(logger);
        }

        private async void AcceptFiltrarionButton_Click(object sender, EventArgs e)
        {
            MedStatDataGridView.DataSource = null;
            MedStatParamDataGridView.DataSource = null;
            AcceptFiltrarionButton.Text = "Завантаження...";
            AcceptFiltrarionButton.Enabled = false;

            await LoadFilteredMedStat();

            AcceptFiltrarionButton.Text = "Фільтрувати";
            refreshTimer.Change(timerDelay == -1 ? (timerDelay = GetTimerDelay()) : timerDelay, System.Threading.Timeout.Infinite);
        }

        private void RefreshButtonClickTimeOut(object sender)
        {
            if (IsHandleCreated)
            {
                AcceptFiltrarionButton.Invoke((Action)(() => AcceptFiltrarionButton.Enabled = true));
            }
            refreshTimer.Change(System.Threading.Timeout.Infinite, System.Threading.Timeout.Infinite);
        }
        private void ResetFilterButtonDelay_AfterCheck(object sender, TreeViewEventArgs e)
        {
            var currentNode = e.Node;

            if (currentNode.Checked)
            {
                var checkedNode = currentNode.Nodes.OfType<TreeNode>()
                                                   .Where(node => node.Checked);

                if (!checkedNode.Any())
                {
                    foreach (TreeNode node in currentNode.Nodes)
                    {
                        node.Tag = "_-1";
                        node.Checked = currentNode.Checked;
                        node.Tag = "_-1";
                    }
                }
                if (currentNode.Parent != null && !currentNode.Parent.Checked)
                {
                    currentNode.Parent.Checked = true;
                }

                if (currentNode.Nodes.Count == 0)
                {
                    var nodeFullPath = currentNode.FullPath;
                    var nameIndex = SelectedIndicatorsListBox.Items.IndexOf(nodeFullPath);
                    if (nameIndex == -1)
                    {
                        SelectedIndicatorsListBox.Items.Add(nodeFullPath);
                    }
                }
            }
            else
            {
                foreach (TreeNode node in currentNode.Nodes)
                {
                    if (node.Checked)
                    {
                        node.Checked = currentNode.Checked;
                    }
                }

                if (currentNode.Parent != null && currentNode.Parent.Checked &&
                    !currentNode.Parent.Nodes.OfType<TreeNode>().Where(node => node.Checked).Any())
                {
                    currentNode.Parent.Checked = false;
                }

                if (currentNode.Nodes.Count == 0)
                {
                    SelectedIndicatorsListBox.Items.Remove(currentNode.FullPath);
                }
            }

            if (!AcceptFiltrarionButton.Enabled)
            {
                refreshTimer.Change(0, System.Threading.Timeout.Infinite);
            }
        }

        private void MedStatDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
        {
            e.ThrowException = false;
        }

        public static Task<MedStatUserControl> CreateInstanceAsync(int objId)
        {
            return Task.Run(() =>
            {
                var newInstance = new MedStatUserControl(objId);
                newInstance.OnLoad(EventArgs.Empty);

                return newInstance;
            });
        }
    }
}
