const Appointment = require('../models/Appointment');

/**
 * 保存预约申请
 */
exports.saveAppointment = async (req, res) => {
  try {
    const userId = req.user.id;  // 从认证信息获取用户ID
    const {
      doctorId,
      doctorName,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      consultationContent,
      urgency,
      timePreference
    } = req.body;

    // 参数验证
    if (!doctorId || !patientName || !patientPhone) {
      return res.status(400).json({
        code: 400,
        message: '医生ID、患者名称和手机号为必填项'
      });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(patientPhone)) {
      return res.status(400).json({
        code: 400,
        message: '请输入正确的手机号码'
      });
    }

    const appointmentId = await Appointment.create({
      userId,  // 保存用户ID
      doctorId,
      doctorName,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      consultationContent,
      urgency,
      timePreference
    });

    return res.status(201).json({
      code: 200,
      message: '预约申请已提交',
      data: {
        id: appointmentId
      }
    });
  } catch (error) {
    console.error('保存预约申请错误:', error);
    return res.status(500).json({
      code: 500,
      message: '保存预约申请失败'
    });
  }
};

/**
 * 获取预约列表（当前用户）
 */
exports.getAppointmentList = async (req, res) => {
  try {
    // 获取当前登录用户ID
    const userId = req.user.id;

    // 根据用户ID获取其预约列表
    const appointments = await Appointment.findByUserId(userId);

    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: appointments
    });
  } catch (error) {
    console.error('获取预约列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取预约列表失败'
    });
  }
};

/**
 * 获取医生的预约列表
 */
exports.getAppointmentByDoctorId = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const appointments = await Appointment.findByDoctorId(doctorId);

    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: appointments
    });
  } catch (error) {
    console.error('获取医生预约列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取预约列表失败'
    });
  }
};

/**
 * 获取患者的预约列表
 */
exports.getAppointmentByPatientPhone = async (req, res) => {
  try {
    const patientPhone = req.params.patientPhone;
    const currentUserPhone = req.user.phone;

    // 权限验证：只能查看自己的预约
    if (patientPhone !== currentUserPhone) {
      return res.status(403).json({
        code: 403,
        message: '无权查看他人预约信息'
      });
    }

    const appointments = await Appointment.findByPatientPhone(patientPhone);

    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: appointments
    });
  } catch (error) {
    console.error('获取患者预约列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取预约列表失败'
    });
  }
};

/**
 * 获取预约详情
 */
exports.getAppointmentDetail = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const currentUserId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        code: 404,
        message: '预约不存在'
      });
    }

    // 权限验证：只能查看自己的预约
    if (appointment.userId !== currentUserId) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该预约信息'
      });
    }

    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: appointment
    });
  } catch (error) {
    console.error('获取预约详情错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取预约详情失败'
    });
  }
};

/**
 * 更新预约申请
 */
exports.updateAppointment = async (req, res) => {
  try {
    const { id, status, notes, timePreference } = req.body;
    const currentUserId = req.user.id;

    if (!id) {
      return res.status(400).json({
        code: 400,
        message: '预约ID为必填项'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        code: 404,
        message: '预约不存在'
      });
    }

    // 权限验证：只有患者（预约者）才能更新
    if (appointment.userId !== currentUserId) {
      return res.status(403).json({
        code: 403,
        message: '无权修改该预约'
      });
    }

    const success = await Appointment.update(id, {
      status: status || appointment.status,
      notes: notes || appointment.notes,
      timePreference: timePreference || appointment.timePreference
    });

    if (success) {
      return res.status(200).json({
        code: 200,
        message: '更新成功'
      });
    } else {
      return res.status(500).json({
        code: 500,
        message: '更新失败'
      });
    }
  } catch (error) {
    console.error('更新预约申请错误:', error);
    return res.status(500).json({
      code: 500,
      message: '更新预约申请失败'
    });
  }
};

/**
 * 删除预约申请
 */
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const currentUserId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        code: 404,
        message: '预约不存在'
      });
    }

    // 权限验证：只有患者（预约者）才能删除
    if (appointment.userId !== currentUserId) {
      return res.status(403).json({
        code: 403,
        message: '无权删除该预约'
      });
    }

    const success = await Appointment.deleteById(appointmentId);

    if (success) {
      return res.status(200).json({
        code: 200,
        message: '删除成功'
      });
    } else {
      return res.status(500).json({
        code: 500,
        message: '删除失败'
      });
    }
  } catch (error) {
    console.error('删除预约申请错误:', error);
    return res.status(500).json({
      code: 500,
      message: '删除预约申请失败'
    });
  }
};

/**
 * 批量删除预约申请
 */
exports.batchDeleteAppointment = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'ids 必须是非空数组'
      });
    }

    let successCount = 0;
    for (const id of ids) {
      const success = await Appointment.deleteById(id);
      if (success) successCount++;
    }

    return res.status(200).json({
      code: 200,
      message: '删除成功',
      data: {
        deletedCount: successCount
      }
    });
  } catch (error) {
    console.error('批量删除预约申请错误:', error);
    return res.status(500).json({
      code: 500,
      message: '批量删除预约申请失败'
    });
  }
};

/**
 * 获取预约统计
 */
exports.getAppointmentCount = async (req, res) => {
  try {
    const { status, doctorId } = req.query;
    const count = await Appointment.count({ status, doctorId });

    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        count
      }
    });
  } catch (error) {
    console.error('获取预约统计错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取预约统计失败'
    });
  }
};
