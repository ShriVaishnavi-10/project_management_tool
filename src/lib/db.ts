import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  User,
  Project,
  Task,
  Comment,
  ActivityLog,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_COMMENTS,
  INITIAL_ACTIVITIES,
} from './initial-data';

// Helper to check if live Supabase credentials are present
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('placeholder') &&
    !url.includes('your-supabase') &&
    !key.includes('placeholder') &&
    !key.includes('your-supabase')
  );
}

// Server-side Supabase Client Singleton
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createSupabaseClient(url, key);
}

// Memory fallback store for offline/local zero-config execution (only active when Supabase keys are absent)
class MemoryStore {
  users: User[] = [...INITIAL_USERS];
  projects: Project[] = [...INITIAL_PROJECTS];
  tasks: Task[] = [...INITIAL_TASKS];
  comments: Comment[] = [...INITIAL_COMMENTS];
  activities: ActivityLog[] = [...INITIAL_ACTIVITIES];

  getUsers() { return this.users; }
  getUserByEmail(email: string) { return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()); }
  getUserById(id: string) { return this.users.find((u) => u.id === id); }
  createUser(user: Omit<User, 'id' | 'createdAt'>) {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }
  updateUserRole(id: string, role: 'admin' | 'member') {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.role = role;
      return user;
    }
    return null;
  }

  getProjects() { return [...this.projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  getProjectById(id: string) { return this.projects.find((p) => p.id === id); }
  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const newProj: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.push(newProj);
    this.logActivity('PROJECT_CREATED', `Created project "${newProj.name}"`, newProj.id, null, newProj.ownerId);
    return newProj;
  }
  updateProject(id: string, updates: Partial<Project>) {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.projects[index] = {
        ...this.projects[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.projects[index];
    }
    return null;
  }
  deleteProject(id: string, userId: string) {
    const proj = this.getProjectById(id);
    if (proj) {
      this.logActivity('PROJECT_CREATED', `Deleted project "${proj.name}"`, null, null, userId);
      this.projects = this.projects.filter((p) => p.id !== id);
      this.tasks = this.tasks.filter((t) => t.projectId !== id);
      return true;
    }
    return false;
  }

  getTasks() { return [...this.tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  getTasksByProject(projectId: string) { return this.tasks.filter((t) => t.projectId === projectId); }
  getTaskById(id: string) { return this.tasks.find((t) => t.id === id); }
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    this.logActivity('TASK_CREATED', `Created task "${newTask.title}"`, newTask.projectId, newTask.id, newTask.creatorId);
    return newTask;
  }
  updateTask(id: string, updates: Partial<Task>, userId: string) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      const oldTask = this.tasks[index];
      const updated = {
        ...oldTask,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.tasks[index] = updated;
      
      let details = `Updated task "${updated.title}"`;
      if (updates.status && updates.status !== oldTask.status) {
        details = `Changed status of "${updated.title}" from ${oldTask.status} to ${updates.status}`;
      }
      this.logActivity('TASK_UPDATED', details, updated.projectId, updated.id, userId);
      return updated;
    }
    return null;
  }
  deleteTask(id: string, userId: string) {
    const task = this.getTaskById(id);
    if (task) {
      this.logActivity('TASK_DELETED', `Deleted task "${task.title}"`, task.projectId, null, userId);
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.comments = this.comments.filter((c) => c.taskId !== id);
      return true;
    }
    return false;
  }

  getCommentsByTask(taskId: string) { return this.comments.filter((c) => c.taskId === taskId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); }
  createComment(content: string, taskId: string, authorId: string) {
    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      content,
      taskId,
      authorId,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(newComment);
    const task = this.getTaskById(taskId);
    if (task) {
      this.logActivity('COMMENT_ADDED', `Added comment on task "${task.title}"`, task.projectId, taskId, authorId);
    }
    return newComment;
  }
  deleteComment(commentId: string, authorId: string) {
    const comment = this.comments.find((c) => c.id === commentId);
    if (comment && comment.authorId === authorId) {
      this.comments = this.comments.filter((c) => c.id !== commentId);
      return true;
    }
    return false;
  }

  getActivities() {
    return [...this.activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  logActivity(
    action: ActivityLog['action'],
    details: string,
    projectId: string | null,
    taskId: string | null,
    userId: string
  ) {
    const log: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      action,
      details,
      projectId,
      taskId,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.activities.unshift(log);
    return log;
  }
}

// Singleton global memory store for Node environment
const globalForStore = globalThis as unknown as { memoryStore?: MemoryStore };
export const dbStore = globalForStore.memoryStore || new MemoryStore();
if (process.env.NODE_ENV !== 'production') globalForStore.memoryStore = dbStore;

// Unified Export Database Layer (Supabase Strictly Returns Real Data)
export const db = {
  // USERS
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
          console.warn('[Supabase Error] getUsers query failed:', error.message);
          return [];
        }
        return (data || []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.password_hash,
          avatar: u.avatar || '',
          role: u.role,
          createdAt: u.created_at,
        }));
      } catch (err) {
        console.error('[Supabase Exception] getUsers:', err);
        return [];
      }
    }
    return dbStore.getUsers();
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).maybeSingle();
        if (data && !error) {
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            avatar: data.avatar || '',
            role: data.role,
            createdAt: data.created_at,
          };
        }
        return null;
      } catch (err) {
        console.error('[Supabase Exception] getUserByEmail:', err);
        return null;
      }
    }
    return dbStore.getUserByEmail(email) || null;
  },

  async getUserById(id: string): Promise<User | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
        if (data && !error) {
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            avatar: data.avatar || '',
            role: data.role,
            createdAt: data.created_at,
          };
        }
        return null;
      } catch (err) {
        console.error('[Supabase Exception] getUserById:', err);
        return null;
      }
    }
    return dbStore.getUserById(id) || null;
  },

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const id = `usr-${Date.now()}`;
        const { data, error } = await supabase.from('users').insert({
          id,
          name: user.name,
          email: user.email,
          password_hash: user.passwordHash,
          avatar: user.avatar,
          role: user.role,
        }).select().single();

        if (data && !error) {
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            avatar: data.avatar || '',
            role: data.role,
            createdAt: data.created_at,
          };
        }
        throw new Error(error?.message || 'Failed to create user in Supabase');
      } catch (err) {
        console.error('[Supabase Exception] createUser:', err);
        throw err;
      }
    }
    return dbStore.createUser(user);
  },

  async updateUserRole(id: string, role: 'admin' | 'member'): Promise<User | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('users')
          .update({ role })
          .eq('id', id)
          .select()
          .single();

        if (data && !error) {
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            avatar: data.avatar || '',
            role: data.role,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.error('[Supabase Exception] updateUserRole:', err);
      }
    }
    return dbStore.updateUserRole(id, role);
  },

  // PROJECTS
  async getProjects(): Promise<Project[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) {
          console.warn('[Supabase Error] getProjects query failed:', error.message);
          return [];
        }
        return (data || []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          status: p.status,
          ownerId: p.owner_id,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
      } catch (err) {
        console.error('[Supabase Exception] getProjects:', err);
        return [];
      }
    }
    return dbStore.getProjects();
  },

  async getProjectById(id: string): Promise<Project | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
        if (data && !error) {
          return {
            id: data.id,
            name: data.name,
            description: data.description || '',
            status: data.status,
            ownerId: data.owner_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
        return null;
      } catch (err) {
        console.error('[Supabase Exception] getProjectById:', err);
        return null;
      }
    }
    return dbStore.getProjectById(id) || null;
  },

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('projects').insert({
          name: project.name,
          description: project.description,
          status: project.status,
          owner_id: project.ownerId,
        }).select().single();

        if (data && !error) {
          const created: Project = {
            id: data.id,
            name: data.name,
            description: data.description || '',
            status: data.status,
            ownerId: data.owner_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          await this.logActivity('PROJECT_CREATED', `Created project "${created.name}"`, created.id, null, created.ownerId);
          return created;
        }
        throw new Error(error?.message || 'Failed to create project in Supabase');
      } catch (err) {
        console.error('[Supabase Exception] createProject:', err);
        throw err;
      }
    }
    return dbStore.createProject(project);
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const payload: Record<string, unknown> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.status !== undefined) payload.status = updates.status;
        payload.updated_at = new Date().toISOString();

        const { data, error } = await supabase.from('projects').update(payload).eq('id', id).select().single();
        if (data && !error) {
          return {
            id: data.id,
            name: data.name,
            description: data.description || '',
            status: data.status,
            ownerId: data.owner_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
        return null;
      } catch (err) {
        console.error('[Supabase Exception] updateProject:', err);
        return null;
      }
    }
    return dbStore.updateProject(id, updates);
  },

  async deleteProject(id: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const proj = await this.getProjectById(id);
        if (proj) {
          const { error } = await supabase.from('projects').delete().eq('id', id);
          if (!error) {
            await this.logActivity('PROJECT_CREATED', `Deleted project "${proj.name}"`, null, null, userId);
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('[Supabase Exception] deleteProject:', err);
        return false;
      }
    }
    return dbStore.deleteProject(id, userId);
  },

  // TASKS
  async getTasks(): Promise<Task[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (error) {
          console.warn('[Supabase Error] getTasks query failed:', error.message);
          return [];
        }
        return (data || []).map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: t.status,
          priority: t.priority,
          dueDate: t.due_date,
          projectId: t.project_id,
          assigneeId: t.assignee_id,
          creatorId: t.creator_id,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
      } catch (err) {
        console.error('[Supabase Exception] getTasks:', err);
        return [];
      }
    }
    return dbStore.getTasks();
  },

  async getTaskById(id: string): Promise<Task | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
        if (data && !error) {
          return {
            id: data.id,
            title: data.title,
            description: data.description || '',
            status: data.status,
            priority: data.priority,
            dueDate: data.due_date,
            projectId: data.project_id,
            assigneeId: data.assignee_id,
            creatorId: data.creator_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
        return null;
      } catch (err) {
        console.error('[Supabase Exception] getTaskById:', err);
        return null;
      }
    }
    return dbStore.getTaskById(id) || null;
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('tasks').insert({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: task.dueDate,
          project_id: task.projectId,
          assignee_id: task.assigneeId,
          creator_id: task.creatorId,
        }).select().single();

        if (data && !error) {
          const newTask: Task = {
            id: data.id,
            title: data.title,
            description: data.description || '',
            status: data.status,
            priority: data.priority,
            dueDate: data.due_date,
            projectId: data.project_id,
            assigneeId: data.assignee_id,
            creatorId: data.creator_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          await this.logActivity('TASK_CREATED', `Created task "${newTask.title}"`, newTask.projectId, newTask.id, newTask.creatorId);
          return newTask;
        }
        throw new Error(error?.message || 'Failed to create task in Supabase');
      } catch (err) {
        console.error('[Supabase Exception] createTask:', err);
        throw err;
      }
    }
    return dbStore.createTask(task);
  },

  async updateTask(id: string, updates: Partial<Task>, userId: string): Promise<Task | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const oldTask = await this.getTaskById(id);
        const payload: Record<string, unknown> = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.priority !== undefined) payload.priority = updates.priority;
        if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
        if (updates.assigneeId !== undefined) payload.assignee_id = updates.assigneeId;
        payload.updated_at = new Date().toISOString();

        const { data, error } = await supabase.from('tasks').update(payload).eq('id', id).select().single();
        if (data && !error) {
          const updated: Task = {
            id: data.id,
            title: data.title,
            description: data.description || '',
            status: data.status,
            priority: data.priority,
            dueDate: data.due_date,
            projectId: data.project_id,
            assigneeId: data.assignee_id,
            creatorId: data.creator_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          let details = `Updated task "${updated.title}"`;
          if (oldTask && updates.status && updates.status !== oldTask.status) {
            details = `Changed status of "${updated.title}" from ${oldTask.status} to ${updates.status}`;
          }
          await this.logActivity('TASK_UPDATED', details, updated.projectId, updated.id, userId);
          return updated;
        }
        return null;
      } catch (err) {
        console.error('[Supabase Exception] updateTask:', err);
        return null;
      }
    }
    return dbStore.updateTask(id, updates, userId);
  },

  async deleteTask(id: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const task = await this.getTaskById(id);
        if (task) {
          const { error } = await supabase.from('tasks').delete().eq('id', id);
          if (!error) {
            await this.logActivity('TASK_DELETED', `Deleted task "${task.title}"`, task.projectId, null, userId);
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('[Supabase Exception] deleteTask:', err);
        return false;
      }
    }
    return dbStore.deleteTask(id, userId);
  },

  // COMMENTS
  async getCommentsByTask(taskId: string): Promise<Comment[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true });
        if (data && !error) {
          return data.map((c) => ({
            id: c.id,
            content: c.content,
            taskId: c.task_id,
            authorId: c.author_id,
            createdAt: c.created_at,
          }));
        }
        return [];
      } catch (err) {
        console.error('[Supabase Exception] getCommentsByTask:', err);
        return [];
      }
    }
    return dbStore.getCommentsByTask(taskId);
  },

  async createComment(content: string, taskId: string, authorId: string): Promise<Comment> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('comments').insert({
          content,
          task_id: taskId,
          author_id: authorId,
        }).select().single();

        if (data && !error) {
          const comm: Comment = {
            id: data.id,
            content: data.content,
            taskId: data.task_id,
            authorId: data.author_id,
            createdAt: data.created_at,
          };
          const task = await this.getTaskById(taskId);
          if (task) {
            await this.logActivity('COMMENT_ADDED', `Added comment on task "${task.title}"`, task.projectId, taskId, authorId);
          }
          return comm;
        }
        throw new Error(error?.message || 'Failed to create comment in Supabase');
      } catch (err) {
        console.error('[Supabase Exception] createComment:', err);
        throw err;
      }
    }
    return dbStore.createComment(content, taskId, authorId);
  },

  async deleteComment(commentId: string, authorId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('comments').delete().eq('id', commentId).eq('author_id', authorId);
        return !error;
      } catch (err) {
        console.error('[Supabase Exception] deleteComment:', err);
        return false;
      }
    }
    return dbStore.deleteComment(commentId, authorId);
  },

  // ACTIVITIES
  async getActivities(): Promise<ActivityLog[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
        if (data && !error) {
          return data.map((a) => ({
            id: a.id,
            action: a.action as ActivityLog['action'],
            details: a.details,
            projectId: a.project_id,
            taskId: a.task_id,
            userId: a.user_id,
            createdAt: a.created_at,
          }));
        }
        return [];
      } catch (err) {
        console.error('[Supabase Exception] getActivities:', err);
        return [];
      }
    }
    return dbStore.getActivities();
  },

  async logActivity(
    action: ActivityLog['action'],
    details: string,
    projectId: string | null,
    taskId: string | null,
    userId: string
  ): Promise<ActivityLog> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('activity_logs').insert({
          action,
          details,
          project_id: projectId,
          task_id: taskId,
          user_id: userId,
        }).select().single();

        if (data && !error) {
          return {
            id: data.id,
            action: data.action as ActivityLog['action'],
            details: data.details,
            projectId: data.project_id,
            taskId: data.task_id,
            userId: data.user_id,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.error('[Supabase Exception] logActivity:', err);
      }
    }
    return dbStore.logActivity(action, details, projectId, taskId, userId);
  },
};
