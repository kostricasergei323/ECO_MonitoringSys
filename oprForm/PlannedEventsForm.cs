﻿using Data;
using Data.Entity;
using System;
using System.Collections.Generic;
using System.Windows.Forms;

namespace oprForm
{
    public partial class PlannedEventsForm : Form
    {
        private DBManager db = new DBManager();
        private int user;
        private int valueCol = 2;
        private int descCol = 1;

        public PlannedEventsForm(int userId)
        {
            InitializeComponent();
            user = userId;
        }

        private void PlannedEventsForm_Load(object sender, EventArgs e)
        {
            db.Connect();
            resLB.Items.Clear();
            var obj = db.GetRows("event_template", "*", "");
            var events = new List<Event>();
            foreach (var row in obj)
            {
                events.Add(EventTemplateMapper.Map(row));
            }

            eventsLB.Items.AddRange(events.ToArray());

            issuesCB.Items.Clear();
            var iss = db.GetRows("issues", "*", "");
            var issues = new List<Issue>();
            foreach (var row in iss)
            {
                issues.Add(IssueMapper.Map(row));
            }

            issuesCB.Items.AddRange(issues.ToArray());
            issuesCB.SelectedIndex = 0;

            var res = db.GetRows("resource", "*", "");
            var resources = new List<Resource>();
            foreach (var row in res)
            {
                resources.Add(ResourceMapper.Map(row));
            }
            resLB.Items.AddRange(resources.ToArray());

            db.Disconnect();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (eventsLB.SelectedItem == null)
            {
                MessageBox.Show("Неможливо додати новий захід. Виберіть необхідний шаблон!", "Помилка", 
                                MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            if (issuesCB.SelectedItem == null)
            {
                MessageBox.Show("Неможливо додати новий захід. Виберіть необхідну задачу!", "Помилка",
                                MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            if (evNameTB.Text == string.Empty)
            {
                MessageBox.Show("Назва заходу не може бути відсутня.", "Помилка",
                                MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            if (user == 0)
            {
                MessageBox.Show("Адмін не може додавати нові заходи.", "Помилка", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            Event ev = eventsLB.SelectedItem as Event;
            Issue issue = (Issue)issuesCB.SelectedItem;

            try
            {
                db.Connect();
                string evName = DBUtil.AddQuotes(evNameTB.Text);
                string evDesc = DBUtil.AddQuotes(descTB.Text);

                string[] evFields = new string[] { "name", "description", "id_of_user", "issue_id" };

                string issueId = issue.Id.ToString();
                string[] evValues = new string[] { evName, evDesc, user.ToString(), issueId };

                int evId = db.InsertToBD("event", evFields, evValues);

                foreach (DataGridViewRow row in eventListGrid.Rows)
                {
                    if (row.Cells[0].Value is Resource)
                    {
                        var res = row.Cells[0].Value as Resource;
                        string desc = "";
                        string value = "";
                        if (row.Cells[descCol].Value != null)
                            desc = DBUtil.AddQuotes(row.Cells[descCol].Value.ToString());
                        if (row.Cells[valueCol].Value != null)
                            value = row.Cells[valueCol].Value.ToString();

                        string[] fields = { "event_id", "resource_id", "value", "description" };
                        string[] values = { evId.ToString(), res.Id.ToString(), value, desc };

                        db.InsertToBD("event_resource", fields, values);
                    }
                }
                db.Disconnect();

                MessageBox.Show("Захід " + evNameTB.Text + " додано.");
            }
            catch(Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }

        private void eventsLB_SelectedIndexChanged(object sender, EventArgs e)
        {
            // TODO Confirmation if data entered
            if (eventsLB.SelectedItem is Event)
            {
                addGB.Visible = true;
                db.Connect();
                Event ev = eventsLB.SelectedItem as Event;
                if (ev == null)
                {
                    db.Disconnect();
                    return;
                }
                var resourcesForEvent = db.GetRows("template_resource", "template_id, resource_id",
                    "template_id=" + ev.Id);
                var resources = new List<Resource>();
                foreach (var resForEvent in resourcesForEvent)
                {
                    var res = db.GetRows("resource", "*", "resource_id=" + resForEvent[1]);
                    resources.Add(ResourceMapper.Map(res[0]));
                }

                eventListGrid.Rows.Clear();
                foreach (var r in resources)
                {
                    eventListGrid.Rows.Add(r, r.Description);
                }
                evNameTB.Text = ev.Name;
                descTB.Text = ev.Description;

                db.Disconnect();
            }
        }

        // Assign value from data grid view to needed resource object
        private void commitValue(object sender, DataGridViewCellEventArgs e)
        {
            if (eventListGrid.Rows[e.RowIndex].Cells[0].Value is Resource)
            {
                var res = eventListGrid.Rows[e.RowIndex].Cells[0].Value as Resource;
                if (e.ColumnIndex == valueCol)
                {
                    try
                    {
                        var val = Int32.Parse(eventListGrid.Rows[e.RowIndex].Cells[e.ColumnIndex].Value.ToString());
                        if (val > 0)
                        {
                            res.Value = val;
                            return;
                        }
                        else
                            throw new ArgumentException();
                    }
                    catch (FormatException)
                    {
                        cancelEdit();
                        MessageBox.Show("Введiть цiле число.");
                        return;
                    }
                    catch (ArgumentException)
                    {
                        MessageBox.Show("Число повинно бути > 0");
                    }
                }
                if (e.ColumnIndex == descCol)
                {
                    var val = eventListGrid.Rows[e.RowIndex].Cells[e.ColumnIndex].Value.ToString();
                    if (val.Length != 0 && !val.Equals(" "))
                        res.Description = val;
                    else
                    {
                        MessageBox.Show("Опис не повинен бути пустим.");
                    }
                }
            }
        }

        private void cancelEdit()
        {
            //(eventListGrid.DataSource as DataTable).RejectChanges();
            eventListGrid.CancelEdit();
            eventListGrid.RefreshEdit();
        }

        private void checkBox1_CheckedChanged(object sender, EventArgs e)
        {
            if (onlyExpCB.Checked)
            {
                eventsLB.Items.Clear();
                db.Connect();
                var obj = db.GetRows("event_template", "*", "expert_id=" + user);
                var events = new List<Event>();
                foreach (var row in obj)
                {
                    events.Add(EventTemplateMapper.Map(row));
                }

                eventsLB.Items.AddRange(events.ToArray());
                db.Disconnect();
            }
            else
            {
                eventsLB.Items.Clear();
                PlannedEventsForm_Load(this, e);
            }
        }

        private void resLB_DoubleClick(object sender, EventArgs e)
        {
            Resource res = resLB.SelectedItem as Resource;

            foreach (DataGridViewRow row in eventListGrid.Rows)
            {
                if (row.Cells[0].Value == res)
                    return;
            }
            eventListGrid.Rows.Add(res, res.Description);
        }
    }
}